import { Hono } from 'hono';
import { createDb } from '../../db';
import { requireRole } from '../middlewares/rbac';
import type { Bindings } from '../index';
import { apiResponse } from '../lib/response';

export const settingsRoutes = new Hono<{ Bindings: Bindings }>();

// All settings operations require admin role
settingsRoutes.use('/*', requireRole(['admin']));

// Only admins can modify core settings
settingsRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const result = await db.selectFrom('options')
    .selectAll()
    .where('name', 'like', 'flare:%')
    .execute();
  return apiResponse.ok(c, result);
});

settingsRoutes.patch('/', requireRole(['admin']), async (c) => {
  const body = await c.req.json();
  const db = createDb(c.env.DB);

  try {
    for (const [key, value] of Object.entries(body)) {
      const settingName = key.startsWith('flare:') ? key : `flare:${key}`;
      await db.insertInto('options')
        .values({
          name: settingName,
          value: String(value)
        })
        .onConflict((oc) => oc.column('name').doUpdateSet({
          value: String(value)
        }))
        .execute();
    }
    return apiResponse.ok(c, { success: true });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});
