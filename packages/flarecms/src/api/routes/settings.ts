import { Hono } from 'hono';
import { createDb } from '../../db';
import { requireRole } from '../middlewares/rbac';
import type { Bindings, Variables } from '../../types';
import { apiResponse } from '../lib/response';

export const settingsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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
    const settings = Object.entries(body).map(([key, value]) => ({
      name: key.startsWith('flare:') ? key : `flare:${key}`,
      value: String(value),
    }));

    if (settings.length > 0) {
      await db
        .insertInto('options')
        .values(settings)
        .onConflict((oc: any) =>
          oc.column('name').doUpdateSet({
            value: (eb: any) => eb.ref('excluded.value'),
          }),
        )
        .execute();
    }

    return apiResponse.ok(c, { success: true });
  } catch (e: any) {
    return apiResponse.error(c, e.message);
  }
});
