import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb, collections, fields, users, createCollectionTable, addFieldToTable } from '@flare/db';
import { sql, eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { generateSessionToken, verifyPassword } from '@flare/auth';
import { cache } from './cache';
import { authMiddleware } from './auth';
import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AUTH_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Auth Middlewares
app.use('/api/*', authMiddleware);

// API Group
const api = new Hono<{ Bindings: Bindings }>();

// Auth Endpoints
api.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const db = createDb(c.env.DB);
  
  // For the very first user (Admin setup)
  // In a real app, this would be a proper setup flow.
  // We'll allow a hardcoded cred for MCP demo: admin@flare.com / admin123
  if (email === 'admin@flare.com' && password === 'admin123') {
    return c.json({ token: c.env.AUTH_SECRET || 'flarecms-secret-123' });
  }

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !(await verifyPassword(password, user.password))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  return c.json({ token: c.env.AUTH_SECRET || 'flarecms-secret-123' });
});

api.get('/setup', async (c) => {
  const db = createDb(c.env.DB);
  try {
    // Create base tables if they don't exist
    await c.env.DB.batch([
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS fc_collections (id TEXT PRIMARY KEY, slug TEXT UNIQUE, label TEXT, label_singular TEXT, created_at INTEGER, updated_at TEXT)`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS fc_fields (id TEXT PRIMARY KEY, collection_id TEXT, label TEXT, slug TEXT, type TEXT, required INTEGER, created_at INTEGER)`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS fc_users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT, created_at INTEGER)`)
    ]);
    return c.json({ success: true, message: 'Database initialized' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.get('/health', (c) => c.json({ status: 'ok' }));

// Collections Management
api.get('/collections', async (c) => {
  const db = createDb(c.env.DB);
  const result = await db.select().from(collections).all();
  return c.json(result);
});

api.post('/collections', async (c) => {
  const body = await c.req.json();
  const db = createDb(c.env.DB);
  const id = ulid();
  
  try {
    // 1. Save metadata
    await db.insert(collections).values({
      id,
      slug: body.slug,
      label: body.label,
      labelSingular: body.labelSingular,
    }).run();

    // 2. Create physical table
    await createCollectionTable(db, body.slug);

    // 3. Initialize cache
    await cache.setSchema(c.env.KV, body.slug, {
      id,
      slug: body.slug,
      label: body.label,
      fields: [],
    });

    return c.json({ id, slug: body.slug }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

api.get('/collections/:slug/schema', async (c) => {
  const slug = c.req.param('slug');
  
  // 1. Try Cache
  const cached = await cache.getSchema(c.env.KV, slug);
  if (cached) return c.json(cached);

  // 2. Fallback to D1
  const db = createDb(c.env.DB);
  const collection = await db.select().from(collections).where(eq(collections.slug, slug)).get();
  if (!collection) return c.json({ error: 'Collection not found' }, 404);
  
  const colFields = await db.select().from(fields).where(eq(fields.collectionId, collection.id)).all();
  
  const schema = { ...collection, fields: colFields };
  
  // 3. Populate Cache
  await cache.setSchema(c.env.KV, slug, schema);
  
  return c.json(schema);
});

api.post('/collections/:id/fields', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = createDb(c.env.DB);
  const fieldId = ulid();

  try {
    // Get collection slug
    const collection = await db.select().from(collections).where(eq(collections.id, id)).get();
    if (!collection) return c.json({ error: 'Collection not found' }, 404);

    // 1. Save field metadata
    await db.insert(fields).values({
      id: fieldId,
      collectionId: id,
      slug: body.slug,
      label: body.label,
      type: body.type,
      required: body.required ?? false,
    }).run();

    // 2. Alter physical table
    await addFieldToTable(db, collection.slug, body.slug, body.type);

    // 3. Invalidate cache to force re-fetch from D1 next time or update it
    await cache.invalidateSchema(c.env.KV, collection.slug);

    return c.json({ id: fieldId }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

// Dynamic Content
api.get('/content/:collection', async (c) => {
  const collection = c.req.param('collection');
  const db = createDb(c.env.DB);
  try {
    const result = await db.run(sql.raw(`SELECT * FROM ec_${collection} WHERE status != 'deleted'`));
    return c.json(result);
  } catch (e) {
    return c.json({ error: 'Collection not found or access error' }, 404);
  }
});

api.put('/content/:collection/:id', async (c) => {
  const collection = c.req.param('collection');
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = createDb(c.env.DB);
  
  const sets = Object.entries(body)
    .map(([k, v]) => `${k} = ${typeof v === 'string' ? `'${v}'` : v}`)
    .join(', ');
  
  try {
    await db.run(sql.raw(`UPDATE ec_${collection} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = '${id}'`));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

api.delete('/content/:collection/:id', async (c) => {
  const collection = c.req.param('collection');
  const id = c.req.param('id');
  const db = createDb(c.env.DB);
  
  try {
    await db.run(sql.raw(`DELETE FROM ec_${collection} WHERE id = '${id}'`));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 400);
  }
});

app.route('/api', api);

// The Admin UI is served by Cloudflare Workers Assets automatically 
// if defined in wrangler.toml. Hono will fall back to it for non-API routes 
// if we don't catch them.

export default app;
