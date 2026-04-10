import { Hono } from 'hono';

import { setupMiddleware, authMiddleware } from '../middlewares/auth';
import { createDb, ensureUniqueSlug, createCollectionTable, addFieldToTable } from '../../db';
import { ulid } from 'ulidx';
import { dynamicContentSchema, collectionSchema, fieldSchema } from '../schemas';
import { sql } from 'kysely';
import { cache } from '../lib/cache';
import type { Bindings, Variables } from '../../types';

export const mcpRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

mcpRoutes.use('*', setupMiddleware);
mcpRoutes.use('*', authMiddleware);

/**
 * In Cloudflare Workers, long-polling / SSE streams combined with separate POST endpoints can fail
 * because a POST might route to a different worker isolate than the GET SSE connection, dropping the message.
 *
 * FlareCMS implements a "Stateless RPC Endpoint" that allows specialized proxy agents to 
 * execute standard MCP-like tool calls synchronously. This works 100% within the Edge environment.
 */

mcpRoutes.post("/execute", async (c) => {
  try {
    const db = createDb(c.env.DB);
    const body = await c.req.json();
    const { tool, arguments: args } = body;

    if (!tool) {
      return c.json({ error: "No tool specified" }, 400);
    }

    if (tool === "list_collections") {
      const collections = await db.selectFrom('fc_collections').selectAll().execute();
      return c.json({
        content: [{ type: "text", text: JSON.stringify(collections, null, 2) }]
      });
    }

    if (tool === "read_content") {
      const collectionSlug = args?.collection as string;
      const limit = (args?.limit as number) || 10;

      if (!collectionSlug) return c.json({ error: "Missing 'collection' argument" }, 400);

      const collectionRecord = await db.selectFrom('fc_collections')
        .select('id')
        .where('slug', '=', collectionSlug)
        .executeTakeFirst();

      if (!collectionRecord) {
        return c.json({ content: [{ type: "text", text: `Error: Collection '${collectionSlug}' not found.` }] });
      }

      const tableName = `ec_${collectionSlug}`;

      const content = await db.selectFrom(tableName as any)
        .selectAll()
        .where('status', '!=', 'deleted')
        .limit(limit)
        .execute().catch(() => []); // Graceful fail if table doesn't exist yet

      return c.json({ content: [{ type: "text", text: JSON.stringify(content, null, 2) }] });
    }

    if (tool === "get_collection_schema") {
      const collectionSlug = args?.collection as string;
      if (!collectionSlug) return c.json({ error: "Missing 'collection' argument" }, 400);

      const collection = await db.selectFrom('fc_collections')
        .selectAll()
        .where('slug', '=', collectionSlug)
        .executeTakeFirst();

      if (!collection) {
        return c.json({ content: [{ type: "text", text: `Error: Collection '${collectionSlug}' not found.` }] });
      }

      const fields = await db.selectFrom('fc_fields')
        .selectAll()
        .where('collection_id', '=', collection.id)
        .execute();

      const schema = {
        metadata: {
          ...collection,
          features: collection.features ? JSON.parse(collection.features) : []
        },
        fields
      };

      return c.json({
        content: [{ type: "text", text: JSON.stringify(schema, null, 2) }]
      });
    }

    if (tool === "create_document") {
      const collectionName = args?.collection as string;
      const data = args?.data;

      if (!collectionName || !data) {
        return c.json({ error: "Missing 'collection' or 'data' argument" }, 400);
      }

      const collection = await db.selectFrom('fc_collections')
        .select('id')
        .where('slug', '=', collectionName)
        .executeTakeFirst();

      if (!collection) return c.json({ error: `Collection '${collectionName}' not found` }, 404);

      const parsed = dynamicContentSchema.safeParse(data);
      if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

      const id = ulid();
      const docData = parsed.data;

      const baseSlug = docData.slug || docData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || id;
      const slug = await ensureUniqueSlug(db, collectionName, baseSlug);
      const status = docData.status || 'draft';

      const doc = {
        ...docData,
        id,
        slug,
        status,
      };

      await db.insertInto(`ec_${collectionName}` as any)
        .values(doc)
        .execute();

      return c.json({
        content: [{ type: "text", text: `Success: Document created with ID ${id} and slug ${slug}` }]
      });
    }

    if (tool === "update_document") {
      const collectionName = args?.collection as string;
      const id = args?.id as string;
      const data = args?.data;

      if (!collectionName || !id || !data) {
        return c.json({ error: "Missing 'collection', 'id', or 'data' argument" }, 400);
      }

      const parsed = dynamicContentSchema.safeParse(data);
      if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

      // Handle slug change uniqueness
      let finalData = { ...parsed.data };
      if (finalData.slug) {
        finalData.slug = await ensureUniqueSlug(db, collectionName, finalData.slug, id);
      }

      await db.updateTable(`ec_${collectionName}` as any)
        .set({
          ...finalData,
          updated_at: sql`CURRENT_TIMESTAMP`
        })
        .where('id', '=', id)
        .execute();

      return c.json({
        content: [{ type: "text", text: `Success: Document ${id} updated.` }]
      });
    }

    if (tool === "create_collection") {
      const data = args;
      const parsed = collectionSchema.safeParse(data);
      if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

      const id = ulid();
      const slug = parsed.data.slug;

      await db.insertInto('fc_collections')
        .values({
          id,
          slug,
          label: parsed.data.label,
          label_singular: parsed.data.labelSingular || null,
          description: parsed.data.description || null,
          icon: parsed.data.icon || null,
          is_public: parsed.data.isPublic ? 1 : 0,
        })
        .execute();

      await createCollectionTable(db, slug);

      // Sync cache
      await cache.invalidateSchema(c.env.KV, slug);
      await cache.invalidateCollectionList(c.env.KV);

      return c.json({
        content: [{ type: "text", text: `Success: Collection '${slug}' created with ID ${id}` }]
      });
    }

    if (tool === "update_collection") {
      const id = args?.id as string;
      const data = args?.data;

      if (!id || !data) return c.json({ error: "Missing 'id' or 'data' argument" }, 400);

      await db.updateTable('fc_collections')
        .set({
          ...data,
          updated_at: sql`CURRENT_TIMESTAMP`
        })
        .where('id', '=', id)
        .execute();

      // Sync cache
      const updatedCol = await db.selectFrom('fc_collections')
        .select('slug')
        .where('id', '=', id)
        .executeTakeFirst();

      if (updatedCol) {
        await cache.invalidateSchema(c.env.KV, updatedCol.slug);
        await cache.invalidateCollectionList(c.env.KV);
      }

      return c.json({
        content: [{ type: "text", text: `Success: Collection ${id} updated.` }]
      });
    }

    if (tool === "add_field") {
      const collectionId = args?.collection_id as string;
      const data = args?.field;

      if (!collectionId || !data) return c.json({ error: "Missing 'collection_id' or 'field' argument" }, 400);

      const parsed = fieldSchema.safeParse(data);
      if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

      const collection = await db.selectFrom('fc_collections')
        .select('slug')
        .where('id', '=', collectionId)
        .executeTakeFirst();

      if (!collection) return c.json({ error: 'Collection not found' }, 404);

      const fieldId = ulid();
      await db.insertInto('fc_fields')
        .values({
          id: fieldId,
          collection_id: collectionId,
          slug: parsed.data.slug,
          label: parsed.data.label,
          type: parsed.data.type,
          required: parsed.data.required ? 1 : 0,
        })
        .execute();

      await addFieldToTable(db, collection.slug, parsed.data.slug, parsed.data.type);

      // Sync cache
      await cache.invalidateSchema(c.env.KV, collection.slug);

      return c.json({
        content: [{ type: "text", text: `Success: Field '${parsed.data.slug}' added to collection '${collection.slug}'` }]
      });
    }

    return c.json({ error: "Tool not found" }, 404);
  } catch (error: any) {
    return c.json({ error: `Server Error: ${error.message}` }, 500);
  }
});
