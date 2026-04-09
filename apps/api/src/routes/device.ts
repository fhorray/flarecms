import { Hono } from 'hono';
import { createDb } from 'flarecms/db';
import { ulid } from 'ulidx';
import { deviceCodeRequestSchema, deviceTokenRequestSchema, deviceApproveSchema } from '../schemas/tokens';
import { encodeHexLowerCase } from '@oslojs/encoding';
import type { Bindings, Variables } from '../index';
import { requireRole } from '../middlewares/rbac';
import { authMiddleware } from '../middlewares/auth';
import { apiResponse } from '../lib/response';

export const deviceRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();


/**
 * 1. CLI requests a device code
 * Public unauthenticated endpoint
 */
deviceRoutes.post('/code', async (c) => {
  const body = await c.req.json();
  const parsed = deviceCodeRequestSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const clientId = parsed.data.client_id;
  const requestedScopes = parsed.data.scope ? parsed.data.scope.split(' ') : ['content:read']; // Default Scope

  // Generate Device Code
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const deviceCode = encodeHexLowerCase(bytes);

  // Generate short user code (ex: ABCD-1234)
  const userCode = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins to authorize

  await db.insertInto('fc_device_codes')
    .values({
      device_code: deviceCode,
      user_code: userCode,
      client_id: clientId,
      user_id: null,
      scopes: JSON.stringify(requestedScopes),
      expires_at: expiresAt.toISOString(),
    })
    .execute();

  return apiResponse.ok(c, {
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: new URL(c.req.url).origin + '/device', // Assuming UI is there
    expires_in: 900,
    interval: 5
  });
});

/**
 * 2. CLI Polls for token using device code
 * Public unauthenticated endpoint
 */
deviceRoutes.post('/token', async (c) => {
  const body = await c.req.json();
  const parsed = deviceTokenRequestSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const { device_code, client_id } = parsed.data;

  const codeRecord = await db.selectFrom('fc_device_codes')
    .selectAll()
    .where('device_code', '=', device_code)
    .where('client_id', '=', client_id)
    .executeTakeFirst();

  if (!codeRecord) return apiResponse.error(c, 'invalid_grant');

  if (new Date(codeRecord.expires_at) < new Date()) {
    return apiResponse.error(c, 'expired_token');
  }

  if (!codeRecord.user_id) {
    return apiResponse.error(c, 'authorization_pending');
  }

  // Approved! Create a real PAT
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const suffix = encodeHexLowerCase(randomBytes);
  const tokenId = `ec_pat_${ulid()}`;
  const fullToken = `${tokenId}_${suffix}`;

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(suffix));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.insertInto('fc_api_tokens')
    .values({
      id: tokenId,
      user_id: codeRecord.user_id,
      name: `Device Authorization (${client_id})`,
      hash: hashHex,
      scopes: codeRecord.scopes, // Inherit requested scopes
      expires_at: null,
      last_used_at: null,
    })
    .execute();

  // Delete consumed device code
  await db.deleteFrom('fc_device_codes').where('device_code', '=', device_code).execute();

  return apiResponse.ok(c, {
    access_token: fullToken,
    token_type: 'bearer',
    scope: JSON.parse(codeRecord.scopes).join(' ')
  });
});

/**
 * 3. UI Approves code
 * Authenticated Endpoint (User must be logged in to approve)
 */
// Temporary middleware stack application for this route specifically
const approvalApp = new Hono<{ Bindings: Bindings; Variables: Variables }>();

approvalApp.use('*', authMiddleware);
approvalApp.use('*', requireRole(['admin', 'editor']));

approvalApp.post('/verify', async (c) => {
  const body = await c.req.json();
  const parsed = deviceApproveSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const user = c.get('user');
  const db = createDb(c.env.DB);
  const userCode = parsed.data.user_code.toUpperCase(); // normalize

  const codeRecord = await db.selectFrom('fc_device_codes')
    .selectAll()
    .where('user_code', '=', userCode)
    .where('user_id', 'is', null) // Only unapproved codes
    .executeTakeFirst();

  if (!codeRecord) return apiResponse.error(c, 'Invalid or expired user code', 404);

  if (new Date(codeRecord.expires_at) < new Date()) {
    await db.deleteFrom('fc_device_codes').where('user_code', '=', userCode).execute();
    return apiResponse.error(c, 'Code expired');
  }

  // Approve it! Attach the user ID
  await db.updateTable('fc_device_codes')
    .set({ user_id: user.id })
    .where('user_code', '=', userCode)
    .execute();

  return apiResponse.ok(c, { success: true, scopes: JSON.parse(codeRecord.scopes) });
});

deviceRoutes.route('/', approvalApp);
