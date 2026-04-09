import { Hono } from 'hono';
import { createDb, createCollectionTable, addFieldToTable } from '@flare/db';
import { sql } from 'kysely';
import { ulid } from 'ulidx';
import { collectionSchema, fieldSchema } from '../schemas';
import { cache } from '../lib/cache';
import type { Bindings } from '../index';
import { apiResponse } from '../lib/response';

import { requireRole } from '../middlewares/rbac';

export const collectionsRoutes = new Hono<{ Bindings: Bindings }>();

// Only admins can modify collections. Everyone authenticated can read.
collectionsRoutes.post('/*', requireRole(['admin']));
collectionsRoutes.post('/', requireRole(['admin']));

collectionsRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const result = await db.selectFrom('fc_collections').selectAll().execute();
  return apiResponse.ok(c, result);
});

collectionsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }
  
  const db = createDb(c.env.DB);
  const id = ulid();
  const data = parsed.data;
  
  try {
    // 1. Save metadata
    await db.insertInto('fc_collections')
      .values({
        id,
        slug: data.slug,
        label: data.label,
        label_singular: data.labelSingular || null,
        description: data.description || null,
        icon: data.icon || null,
        is_public: data.isPublic ? 1 : 0,
        features: data.features ? JSON.stringify(data.features) : null,
        url_pattern: data.urlPattern || null,
      })
      .execute();

    // 2. Create physical table
    await createCollectionTable(db, data.slug);

    // 3. Initialize cache
    await cache.setSchema(c.env.KV, data.slug, {
      id,
      slug: data.slug,
      label: data.label,
      is_public: data.isPublic ? 1 : 0,
      features: data.features || [],
      url_pattern: data.urlPattern || null,
      fields: [],
    });

    return apiResponse.created(c, { id, slug: data.slug });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});

collectionsRoutes.get('/:slug/schema', async (c) => {
  const slug = c.req.param('slug');
  
  // 1. Try Cache
  const cached = await cache.getSchema(c.env.KV, slug);
  if (cached) return apiResponse.ok(c, cached);

  // 2. Fallback to D1
  const db = createDb(c.env.DB);
  const collection = await db.selectFrom('fc_collections')
    .selectAll()
    .where('slug', '=', slug)
    .executeTakeFirst();
    
  if (!collection) return apiResponse.error(c, 'Collection not found', 404);
  
  const colFields = await db.selectFrom('fc_fields')
    .selectAll()
    .where('collection_id', '=', collection.id)
    .execute();
  
  const schema = { 
    ...collection, 
    features: collection.features ? JSON.parse(collection.features) : [],
    fields: colFields 
  };
  
  // 3. Populate Cache
  await cache.setSchema(c.env.KV, slug, schema);
  
  return apiResponse.ok(c, schema);
});

collectionsRoutes.post('/:id/fields', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = fieldSchema.safeParse(body);
  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }

  const db = createDb(c.env.DB);
  const fieldId = ulid();
  const data = parsed.data;

  try {
    // Get collection slug
    const collection = await db.selectFrom('fc_collections')
      .select('slug')
      .where('id', '=', id)
      .executeTakeFirst();
      
    if (!collection) return apiResponse.error(c, 'Collection not found', 404);

    // 1. Save field metadata
    await db.insertInto('fc_fields')
      .values({
        id: fieldId,
        collection_id: id,
        slug: data.slug,
        label: data.label,
        type: data.type,
        required: data.required ? 1 : 0,
      })
      .execute();

    // 2. Alter physical table
    await addFieldToTable(db, collection.slug, data.slug, data.type);

    // 3. Invalidate cache to force re-fetch from D1 next time or update it
    await cache.invalidateSchema(c.env.KV, collection.slug);

    return apiResponse.created(c, { id: fieldId });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});

collectionsRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = createDb(c.env.DB);

  // Partial update support
  const data: any = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.labelSingular !== undefined) data.label_singular = body.labelSingular;
  if (body.description !== undefined) data.description = body.description;
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.isPublic !== undefined) data.is_public = body.isPublic ? 1 : 0;
  if (body.features !== undefined) data.features = JSON.stringify(body.features);
  if (body.urlPattern !== undefined) data.url_pattern = body.urlPattern;

  try {
    const collection = await db.selectFrom('fc_collections')
      .select('slug')
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!collection) return apiResponse.error(c, 'Collection not found', 404);

    await db.updateTable('fc_collections')
      .set({
        ...data,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .where('id', '=', id)
      .execute();

    await cache.invalidateSchema(c.env.KV, collection.slug);
    return apiResponse.ok(c, { success: true });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});
