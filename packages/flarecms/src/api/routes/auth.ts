import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createDb } from '../../db';
import { verifyPassword, hashPassword, generateSessionToken } from '../../auth';
import { ulid } from 'ulidx';
import { loginSchema, signupSchema, webauthnVerifySchema } from '../schemas';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { decodeBase64url, encodeBase64url } from '@oslojs/encoding';
import type { Bindings, Variables } from '../index';

import { apiResponse } from '../lib/response';

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get current user info
authRoutes.get('/me', async (c) => {
  return apiResponse.ok(c, c.get('user'));
});

// Get registration settings (public)
authRoutes.get('/registration-settings', async (c) => {
  const db = createDb(c.env.DB);
  const options = await db.selectFrom('options')
    .select(['name', 'value'])
    .where('name', 'in', ['flare:signup_enabled', 'flare:signup_default_role'])
    .execute();

  const settings = options.reduce((acc, opt) => {
    acc[opt.name.replace('flare:', '')] = opt.value;
    return acc;
  }, {} as Record<string, string>);

  return apiResponse.ok(c, settings);
});

async function getRoleForEmail(db: any, email: string): Promise<string> {
  const options = await db.selectFrom('options')
    .select('value')
    .where('name', '=', 'flare:signup_domain_rules')
    .executeTakeFirst();

  const defaultRoleOpt = await db.selectFrom('options')
    .select('value')
    .where('name', '=', 'flare:signup_default_role')
    .executeTakeFirst();

  const domain = email.split('@')[1] as string;
  const rules = JSON.parse(options?.value || '{}');
  const defaultRole = defaultRoleOpt?.value || 'viewer';

  return rules[domain] || defaultRole;
}

// Signup (public)
authRoutes.post('/signup', async (c) => {
  const body = await c.req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const { email, password } = parsed.data;
  const db = createDb(c.env.DB);

  // Check if signup is enabled
  const signupEnabled = await db.selectFrom('options')
    .select('value')
    .where('name', '=', 'flare:signup_enabled')
    .executeTakeFirst();

  if (signupEnabled?.value !== 'true') {
    return apiResponse.error(c, 'Self-registration is currently disabled', 403);
  }

  // Check if user already exists
  const existing = await db.selectFrom('fc_users')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (existing) return apiResponse.error(c, 'Email already in use');

  const role = await getRoleForEmail(db, email);
  const userId = ulid();
  const hashedPassword = await hashPassword(password);

  await db.insertInto('fc_users')
    .values({
      id: userId,
      email,
      password: hashedPassword,
      role,
      disabled: 0,
    })
    .execute();

  // Create Session
  const sessionId = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.insertInto('fc_sessions')
    .values({ id: sessionId, user_id: userId, expires_at: expiresAt.toISOString() })
    .execute();

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires: expiresAt,
    path: '/'
  });

  return apiResponse.ok(c, { success: true, user: { email, role } });
});

// List user's passkeys
authRoutes.get('/passkeys', async (c) => {
  const user = c.get('user');
  const db = createDb(c.env.DB);
  const passkeys = await db.selectFrom('fc_passkeys')
    .select(['id', 'device_type', 'last_used_at', 'created_at'])
    .where('user_id', '=', user.id)
    .execute();
  return apiResponse.ok(c, passkeys);
});

// Passkey Registration Options (Authenticated)
authRoutes.post('/passkey/register/options', async (c) => {
  const user = c.get('user');
  const db = createDb(c.env.DB);

  const existingPasskeys = await db.selectFrom('fc_passkeys')
    .select('id')
    .where('user_id', '=', user.id)
    .execute();

  const options = await generateRegistrationOptions({
    rpName: 'FlareCMS',
    rpID: new URL(c.req.url).hostname,
    userID: new TextEncoder().encode(user.id) as Uint8Array<ArrayBuffer>,
    userName: user.email,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map(pk => ({
      id: pk.id,
      type: 'public-key' as const,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Save challenge to KV
  await c.env.KV.put(`webauthn_reg_auth_${user.id}`, options.challenge, { expirationTtl: 300 });

  return apiResponse.ok(c, options);
});

// Passkey Registration Verification (Authenticated)
authRoutes.post('/passkey/register/verify', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const db = createDb(c.env.DB);

  const expectedChallenge = await c.env.KV.get(`webauthn_reg_auth_${user.id}`);
  if (!expectedChallenge) return apiResponse.error(c, 'Registration session expired');

  const origin = c.req.header('Origin') || new URL(c.req.url).origin;
  const rpID = new URL(origin).hostname;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;

    await db.insertInto('fc_passkeys')
      .values({
        id: credential.id,
        user_id: user.id,
        name: body.name || null,
        public_key: encodeBase64url(credential.publicKey),
        counter: credential.counter,
        device_type: verification.registrationInfo.credentialDeviceType,
        backed_up: verification.registrationInfo.credentialBackedUp ? 1 : 0,
        transports: JSON.stringify(body.response.transports || []),
      })
      .execute();

    await c.env.KV.delete(`webauthn_reg_auth_${user.id}`);
    return apiResponse.ok(c, { success: true });
  }

  return apiResponse.error(c, 'Passkey verification failed');
});

// Revoke a passkey
authRoutes.delete('/passkey/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const db = createDb(c.env.DB);

  await db.deleteFrom('fc_passkeys')
    .where('id', '=', id)
    .where('user_id', '=', user.id)
    .execute();

  return apiResponse.ok(c, { success: true });
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }

  const { email, password } = parsed.data;
  const db = createDb(c.env.DB);

  const user = await db.selectFrom('fc_users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  if (!user || !user.password || !(await verifyPassword(password, user.password))) {
    return apiResponse.error(c, 'Invalid credentials', 401);
  }

  // Create Session
  const sessionId = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session

  await db.insertInto('fc_sessions')
    .values({
      id: sessionId,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .execute();

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true, // Always secure for simplicity in workers
    sameSite: 'Lax',
    expires: expiresAt,
    path: '/'
  });

  return apiResponse.ok(c, { success: true, message: 'Logged in' });
});

authRoutes.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session');
  if (sessionId) {
    const db = createDb(c.env.DB);
    await db.deleteFrom('fc_sessions').where('id', '=', sessionId).execute();
    deleteCookie(c, 'session');
  }
  return apiResponse.ok(c, { success: true });
});

// Passkey Authentication Options (Can be public for login)
authRoutes.post('/passkey/options', async (c) => {
  const body = await c.req.json();
  const db = createDb(c.env.DB);

  // If user is authenticated, use context, otherwise use email from body
  const ctxUser = c.get('user');
  const email = ctxUser?.email || body.email;

  if (!email) return apiResponse.error(c, 'Email required for passkey challenge');

  const user = await db.selectFrom('fc_users').selectAll().where('email', '=', email).executeTakeFirst();
  if (!user) return apiResponse.error(c, 'User not found', 404);

  const passkeys = await db.selectFrom('fc_passkeys').selectAll().where('user_id', '=', user.id).execute();

  const options = await generateAuthenticationOptions({
    rpID: new URL(c.req.url).hostname,
    allowCredentials: passkeys.map(pk => ({
      id: pk.id,
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    })),
  });

  // Save challenge to KV (expires in 5 minutes)
  await c.env.KV.put(`webauthn_auth_${user.id}`, options.challenge, { expirationTtl: 300 });

  return apiResponse.ok(c, options);
});

// Passkey Verification
authRoutes.post('/passkey/verify', async (c) => {
  const body = await c.req.json();
  const parsed = webauthnVerifySchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);
  const user = await db.selectFrom('fc_users').selectAll().where('email', '=', parsed.data.email).executeTakeFirst();
  if (!user) return apiResponse.error(c, 'User not found', 404);

  const expectedChallenge = await c.env.KV.get(`webauthn_auth_${user.id}`);
  if (!expectedChallenge) return apiResponse.error(c, 'Challenge expired or invalid');

  const passkey = await db.selectFrom('fc_passkeys').selectAll().where('id', '=', parsed.data.response.id).where('user_id', '=', user.id).executeTakeFirst();
  if (!passkey) return apiResponse.error(c, 'Passkey not found', 404);

  const origin = c.req.header('Origin') || new URL(c.req.url).origin;
  const rpID = new URL(origin).hostname;

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: parsed.data.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: decodeBase64url(passkey.public_key) as Uint8Array<ArrayBuffer>,
        counter: passkey.counter,
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
    });
  } catch (error: any) {
    return apiResponse.error(c, error.message);
  }

  if (verification.verified) {
    await db.updateTable('fc_passkeys')
      .set({ counter: verification.authenticationInfo.newCounter })
      .where('id', '=', passkey.id)
      .execute();

    // Create Session
    const sessionId = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session

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
      sameSite: 'Lax',
      expires: expiresAt,
      path: '/'
    });

    await c.env.KV.delete(`webauthn_auth_${user.id}`);

    return apiResponse.ok(c, { success: true, message: 'Logged in' });
  }

  return apiResponse.error(c, 'Verification failed');
});
