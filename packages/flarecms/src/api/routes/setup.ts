import { Hono } from 'hono';
import { createDb } from '../../db';
import { hashPassword, generateSessionToken } from '../../auth';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { setCookie } from 'hono/cookie';
import { ulid } from 'ulidx';
import { encodeBase64url } from '@oslojs/encoding';
import { setupSchema, webauthnOptionsSchema, webauthnVerifySchema } from '../schemas';
import type { Bindings, Variables } from '../../types';
import { apiResponse } from '../lib/response';
import { runMigrations } from '../../db';

export const setupRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/setup/status
// Checks if the system is already configured
setupRoutes.get('/status', async (c) => {
  const db = createDb(c.env.DB);
  try {
    const admin = await db
      .selectFrom('fc_users')
      .select('id')
      .where('role', '=', 'admin')
      .executeTakeFirst();

    return apiResponse.ok(c, {
      isConfigured: !!admin,
      version: '0.1.0',
    });
  } catch (e: any) {
    // If table doesn't exist, it's definitely not configured
    return apiResponse.ok(c, {
      isConfigured: false,
      needsMigration: true,
      error: e.message,
    });
  }
});

// POST /api/setup
// Initial admin creation and system configuration
setupRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return apiResponse.error(c, parsed.error.format());
  }

  const db = createDb(c.env.DB);

  // 0. Ensure database tables exist
  try {
    await runMigrations(db);
  } catch (e: any) {
    return apiResponse.error(c, `Migration failed: ${e.message}`, 500);
  }

  // 1. Check if an admin already exists (prevent re-setup)
  const existingAdmin = await db
    .selectFrom('fc_users')
    .select('id')
    .where('role', '=', 'admin')
    .executeTakeFirst();

  if (existingAdmin) {
    return apiResponse.error(c, 'System is already configured', 403);
  }

  const { email, password, title } = parsed.data;
  const userId = ulid();
  const hashedPassword = await hashPassword(password);

  try {
    // 2. Create the admin user
    await db
      .insertInto('fc_users')
      .values({
        id: userId,
        email,
        password: hashedPassword,
        role: 'admin',
        disabled: 0,
      })
      .execute();

    // 3. Save initial settings
    const settings = [
      { name: 'flare:site_name', value: title },
      { name: 'flare:signup_enabled', value: 'false' },
      { name: 'flare:signup_default_role', value: 'viewer' },
      { name: 'flare:setup_complete', value: 'true' },
      { name: 'flare:setup_completed_at', value: new Date().toISOString() },
    ];

    for (const setting of settings) {
      await db
        .insertInto('options')
        .values(setting)
        .onConflict((oc) =>
          oc.column('name').doUpdateSet({ value: setting.value }),
        )
        .execute();
    }

    // 4. Auto-login the new admin
    const sessionId = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db
      .insertInto('fc_sessions')
      .values({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .execute();

    setCookie(c, 'session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      expires: expiresAt,
      path: '/',
    });

    return apiResponse.ok(c, {
      success: true,
      user: { email, role: 'admin' },
    });
  } catch (e: any) {
    return apiResponse.error(c, `Setup failed: ${e.message}`);
  }
});

// Passkey Registration Options (Initial Setup)
setupRoutes.post('/passkey/options', async (c) => {
  const body = await c.req.json();
  const parsed = webauthnOptionsSchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);

  // 0. Ensure database tables exist
  try {
    await runMigrations(db);
  } catch (e: any) {
    return apiResponse.error(c, `Migration check failed: ${e.message}`, 500);
  }

  const userCount = await db
    .selectFrom('fc_users')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirst();

  if (userCount && userCount.count > 0) {
    return apiResponse.error(c, 'Setup already complete');
  }

  const tempUserId = ulid();

  const options = await generateRegistrationOptions({
    rpName: 'FlareCMS',
    rpID: new URL(c.req.url).hostname,
    userID: new TextEncoder().encode(tempUserId) as Uint8Array<ArrayBuffer>,
    userName: parsed.data.email,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Save challenge to KV temporarily (300s TTL)
  await c.env.KV.put(
    `webauthn_reg_${parsed.data.email}`,
    JSON.stringify({
      challenge: options.challenge,
      userId: tempUserId,
    }),
    { expirationTtl: 300 },
  );

  return apiResponse.ok(c, options);
});

// Passkey Verification (Initial Setup)
setupRoutes.post('/passkey/verify', async (c) => {
  const body = await c.req.json();
  const parsed = webauthnVerifySchema.safeParse(body);
  if (!parsed.success) return apiResponse.error(c, parsed.error.format());

  const db = createDb(c.env.DB);

  // 0. Ensure database tables exist
  try {
    await runMigrations(db);
  } catch (e: any) {
    return apiResponse.error(c, `Migration check failed: ${e.message}`, 500);
  }

  const userCount = await db
    .selectFrom('fc_users')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirst();
  if (userCount && userCount.count > 0) {
    return apiResponse.error(c, 'Setup already complete');
  }

  const cachedDataStr = await c.env.KV.get(`webauthn_reg_${parsed.data.email}`);
  if (!cachedDataStr) {
    return apiResponse.error(c, 'Registration session expired');
  }

  const cachedData = JSON.parse(cachedDataStr);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: parsed.data.response,
      expectedChallenge: cachedData.challenge,
      expectedOrigin: new URL(c.req.url).origin,
      expectedRPID: new URL(c.req.url).hostname,
    });
  } catch (error: any) {
    return apiResponse.error(c, error.message);
  }

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;

    try {
      // Create the Admin User
      await db
        .insertInto('fc_users')
        .values({
          id: cachedData.userId,
          email: parsed.data.email,
          password: null, // Passkey only
          role: 'admin',
          disabled: 0,
        })
        .execute();

      // Create Passkey
      await db
        .insertInto('fc_passkeys')
        .values({
          id: credential.id,
          user_id: cachedData.userId,
          public_key: encodeBase64url(credential.publicKey),
          counter: credential.counter,
          device_type: verification.registrationInfo.credentialDeviceType,
          backed_up: verification.registrationInfo.credentialBackedUp ? 1 : 0,
          transports: JSON.stringify(
            parsed.data.response.response.transports || [],
          ),
        })
        .execute();

      await db
        .insertInto('options')
        .values([
          { name: 'flare:setup_complete', value: 'true' },
          { name: 'flare:site_title', value: 'FlareCMS (Passkey Setup)' },
        ])
        .execute();

      // Generate session directly for setup flow convenience
      const sessionId = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db
        .insertInto('fc_sessions')
        .values({
          id: sessionId,
          user_id: cachedData.userId,
          expires_at: expiresAt.toISOString(),
        })
        .execute();

      setCookie(c, 'session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        expires: expiresAt,
        path: '/',
      });

      await c.env.KV.delete(`webauthn_reg_${parsed.data.email}`);

      return apiResponse.ok(c, {
        success: true,
        message: 'Setup completed with Passkey',
      });
    } catch (e: any) {
      return apiResponse.error(c, `Setup failed during storage: ${e.message}`);
    }
  }

  return apiResponse.error(c, 'Passkey verification failed');
});
