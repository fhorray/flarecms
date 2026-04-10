import { Hono } from 'hono';
import { createDb } from '../../db';
import { generateSessionToken } from '../../auth';
import { setCookie } from 'hono/cookie';
import { magicLinkRequestSchema, magicLinkVerifySchema } from '../schemas/auth';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { ulid } from 'ulidx';
import type { Bindings, Variables } from '../../types';
import { apiResponse } from '../lib/response';

export const magicRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();


// Generate Magic Link
magicRoutes.post('/request', async (c) => {
  const body = await c.req.json();
  const parsed = magicLinkRequestSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const { email } = parsed.data;

  // 1. Check Registration Policy
  const signupEnabled = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_enabled').executeTakeFirst();
  const defaultRole = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_default_role').executeTakeFirst();
  const domainRulesRaw = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_domain_rules').executeTakeFirst();

  const isEnabled = signupEnabled?.value === 'true';
  const roleDefault = defaultRole?.value || 'editor';
  const domainRules = JSON.parse(domainRulesRaw?.value || '{}') as Record<string, string>;

  // 2. Link or Provision User
  let user = await db.selectFrom('fc_users').selectAll().where('email', '=', email).executeTakeFirst();

  if (!user) {
    if (!isEnabled) {
      return apiResponse.error(c, 'Signups are currently disabled', 403);
    }

    // Determine role based on domain
    const domain = email.split('@')[1] || '';
    const assignedRole = domainRules[domain] || roleDefault;

    // Provision new user
    const newUser = {
      id: ulid(),
      email,
      password: null,
      role: assignedRole,
      disabled: 0,
    };
    await db.insertInto('fc_users').values(newUser as any).execute();
    user = await db.selectFrom('fc_users').selectAll().where('id', '=', newUser.id).executeTakeFirst();
  }

  if (!user || user.disabled) {
    return apiResponse.error(c, 'Account disabled or not found', 403);
  }

  // Generate secure token
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const rawToken = encodeHexLowerCase(randomBytes);

  // Hash for storage
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

  // Upsert pattern: delete old tokens for this email
  await db.deleteFrom('fc_verification_tokens').where('identifier', '=', email).execute();

  await db.insertInto('fc_verification_tokens')
    .values({
      identifier: email,
      token: hashHex,
      expires_at: expiresAt.toISOString(),
    })
    .execute();

  // In a real app we'd send an email here using SendGrid/Resend
  // For now, we simulate logging it
  console.log(`[MAGIC LINK] -> https://${new URL(c.req.url).hostname}/verify?email=${encodeURIComponent(email)}&token=${rawToken}`);

  return apiResponse.ok(c, {
    success: true,
    message: 'Magic link sent',
    dev_link: `https://${new URL(c.req.url).hostname}/verify?email=${encodeURIComponent(email)}&token=${rawToken}`
  });
});

// Verify Magic Link
magicRoutes.post('/verify', async (c) => {
  const body = await c.req.json();
  const parsed = magicLinkVerifySchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const { email, token } = parsed.data;

  const user = await db.selectFrom('fc_users').selectAll().where('email', '=', email).executeTakeFirst();
  if (!user || user.disabled) return apiResponse.error(c, 'Invalid or expired link', 401);

  // Hash provided token
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const record = await db.selectFrom('fc_verification_tokens')
    .selectAll()
    .where('identifier', '=', email)
    .where('token', '=', hashHex)
    .executeTakeFirst();

  if (!record) return apiResponse.error(c, 'Invalid or expired link', 401);

  if (new Date(record.expires_at) < new Date()) {
    await db.deleteFrom('fc_verification_tokens').where('identifier', '=', email).execute();
    return apiResponse.error(c, 'Link expired', 401);
  }

  // Success! Delete token and create session
  await db.deleteFrom('fc_verification_tokens').where('identifier', '=', email).execute();

  const sessionId = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insertInto('fc_sessions')
    .values({
      id: sessionId,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .execute();

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    expires: expiresAt,
    path: '/'
  });


  return apiResponse.ok(c, { success: true, message: 'Logged in via Magic Link' });
});
