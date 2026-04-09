import { Hono } from 'hono';
import { createDb } from '../../db';
import { ulid } from 'ulidx';
import { tokenCreateSchema } from '../schemas/tokens';
import { encodeHexLowerCase } from '@oslojs/encoding';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middlewares/rbac';
import { apiResponse } from '../lib/response';

export const tokenRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();


// Tokens can only be managed by admins for now
tokenRoutes.use('*', requireRole(['admin']));

// Generate Personal Access Token
tokenRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = tokenCreateSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const user = c.get('user');

  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const suffix = encodeHexLowerCase(randomBytes);
  
  // Example token output: ec_pat_01H..._a1b2c3d4
  const tokenId = `ec_pat_${ulid()}`;
  const fullToken = `${tokenId}_${suffix}`;
  
  // Here we only hash the suffix for storage for security
  // but save tokenId as Primary Key for quick lookups
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(suffix));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.insertInto('fc_api_tokens')
    .values({
      id: tokenId,
      user_id: user.id,
      name: parsed.data.name,
      hash: hashHex,
      scopes: JSON.stringify(parsed.data.scopes),
      expires_at: null,
      last_used_at: null,
    })
    .execute();

  // Return the full unhashed token ONLY ONCE
  return apiResponse.ok(c, { token: fullToken, id: tokenId, name: parsed.data.name });
});

// List User Tokens
tokenRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get('user');
  
  const tokens = await db.selectFrom('fc_api_tokens')
    .select(['id', 'name', 'scopes', 'created_at', 'last_used_at'])
    .where('user_id', '=', user.id)
    .execute();

  return apiResponse.ok(c, tokens.map(t => ({ ...t, scopes: JSON.parse(t.scopes) })));
});

// Revoke Token
tokenRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env.DB);
  const user = c.get('user');

  await db.deleteFrom('fc_api_tokens')
    .where('id', '=', id)
    .where('user_id', '=', user.id) // Only allow revoking own tokens
    .execute();

  return apiResponse.ok(c, { success: true });
});
