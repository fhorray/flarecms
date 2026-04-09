import { Hono } from 'hono';
import { createDb, ensureUniqueSlug } from '../../db';
import { sql } from 'kysely';
import { ulid } from 'ulidx';
import { dynamicContentSchema } from '../schemas';
import type { Bindings } from '../index';
import { apiResponse } from '../lib/response';

import { requireRole, requireScope } from '../middlewares/rbac';

export const contentRoutes = new Hono<{ Bindings: Bindings }>();

// Write operations (POST, PUT, DELETE) restricted to admin or editor roles.
contentRoutes.post('/:collection', requireScope('write', 'collection_slug'), requireRole(['admin', 'editor']));
contentRoutes.put('/:collection/*', requireScope('update', 'collection_slug'), requireRole(['admin', 'editor']));
contentRoutes.delete('/:collection/*', requireScope('delete', 'collection_slug'), requireRole(['admin', 'editor']));

contentRoutes.get('/:collection', requireScope('read', 'collection_slug'), async (c) => {
  const collection = c.req.param('collection');
  const db = createDb(c.env.DB);

  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    // 1. Get total count
    const countRes = await db.selectFrom(`ec_${collection}` as any)
      .select(db.fn.count('id').as('count'))
      .where('status', '!=', 'deleted')
      .executeTakeFirst();

    const total = Number(countRes?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // 2. Get data slice
    const result = await db.selectFrom(`ec_${collection}` as any)
      .selectAll()
      .where('status', '!=', 'deleted')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return apiResponse.paginated(c, result, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});

contentRoutes.get('/:collection/:id', async (c) => {
  const collection = c.req.param('collection');
  const id = c.req.param('id');
  const db = createDb(c.env.DB);
  try {
    const result = await db.selectFrom(`ec_${collection}` as any)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return apiResponse.error(c, 'Document not found', 404);
    return apiResponse.ok(c, result);
  } catch (e) {
    return apiResponse.error(c, 'Access error', 404);
  }
});


contentRoutes.post('/:collection', async (c) => {
  const collectionName = c.req.param('collection');
  const db = createDb(c.env.DB);

  // 1. Get collection metadata
  const collection = await db.selectFrom('fc_collections')
    .select('id')
    .where('slug', '=', collectionName)
    .executeTakeFirst();

  if (!collection) return apiResponse.error(c, 'Collection not found', 404);

  // 2. Check for fields
  const fieldCount = await db.selectFrom('fc_fields')
    .select(db.fn.count('id').as('total'))
    .where('collection_id', '=', collection.id)
    .executeTakeFirst();

  if (!fieldCount || Number(fieldCount.total) === 0) {
    return apiResponse.error(c, 'Cannot create documents in a collection without fields. Please define your schema first.');
  }

  const body = await c.req.json();
  const parsed = dynamicContentSchema.safeParse(body);
  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }

  const id = ulid();
  const data = parsed.data;

  // Handle Required Columns
  const baseSlug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id;
  const slug = await ensureUniqueSlug(db, collectionName, baseSlug);
  const status = data.status || 'draft';

  const doc = {
    ...data,
    id,
    slug,
    status,
  };

  try {
    await db.insertInto(`ec_${collectionName}` as any)
      .values(doc)
      .execute();
    return apiResponse.created(c, { id, slug });
  } catch (e: any) {
    return apiResponse.error(c, `Failed query: ${e.message}`);
  }
});

contentRoutes.put('/:collection/:id', async (c) => {
  const collectionName = c.req.param('collection');
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = dynamicContentSchema.safeParse(body);
  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }

  const db = createDb(c.env.DB);
  const data = parsed.data;

  // Handle slug change uniqueness
  let finalData = { ...data };
  if (data.slug) {
    const uniqueSlug = await ensureUniqueSlug(db, collectionName, data.slug, id);
    finalData.slug = uniqueSlug;
  }

  try {
    await db.updateTable(`ec_${collectionName}` as any)
      .set({
        ...finalData,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .where('id', '=', id)
      .execute();
    return apiResponse.ok(c, { id, success: true, slug: finalData.slug });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});

contentRoutes.delete('/:collection/:id', async (c) => {
  const collectionName = c.req.param('collection');
  const id = c.req.param('id');
  const db = createDb(c.env.DB);

  try {
    await db.deleteFrom(`ec_${collectionName}` as any)
      .where('id', '=', id)
      .execute();
    return apiResponse.ok(c, { success: true });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});
