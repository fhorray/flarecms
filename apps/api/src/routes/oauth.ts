import { Hono } from 'hono';
import { createDb } from 'flarecms/db';
import { generateSessionToken } from 'flarecms/auth';
import { setCookie } from 'hono/cookie';
import { oauthCallbackSchema } from '../schemas/auth';
import { ulid } from 'ulidx';
import type { Bindings, Variables } from '../index';
import { apiResponse } from '../lib/response';

export const oauthRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// OAuth Login (Initiate Redirect)
oauthRoutes.get('/github/login', (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) return apiResponse.error(c, 'GitHub OAuth not configured', 500);

  const redirectUri = encodeURIComponent(`https://${new URL(c.req.url).hostname}/api/oauth/github/callback`);
  const scope = encodeURIComponent('read:user user:email');
  
  // Create secure random state parameter here to store in cookies usually
  const state = Math.random().toString(36).substring(2);

  return c.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`);
});

// OAuth Callback
oauthRoutes.get('/github/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return apiResponse.error(c, 'Missing code');

  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) return apiResponse.error(c, 'GitHub OAuth not configured', 500);

  const db = createDb(c.env.DB);

  try {
    // 1. Exchange Code for Access Token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    const tokenData: any = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    // 2. Fetch User Profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'FlareCMS'
      }
    });
    const userData: any = await userRes.json();

    // 3. Fetch User Emails (GitHub separates primary email)
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'FlareCMS'
      }
    });
    const emailData: any[] = await emailRes.json();
    const primaryEmail = emailData.find((e: any) => e.primary)?.email || userData.email;

    if (!primaryEmail) throw new Error('No public email found in GitHub account');

    // 4. Link or Provision User Account
    const githubId = String(userData.id);
    let user = await db.selectFrom('fc_oauth_accounts')
      .innerJoin('fc_users', 'fc_oauth_accounts.user_id', 'fc_users.id')
      .select(['fc_users.id', 'fc_users.disabled'])
      .where('fc_oauth_accounts.provider_id', '=', 'github')
      .where('fc_oauth_accounts.provider_user_id', '=', githubId)
      .executeTakeFirst();

    if (!user) {
      // Look for existing user by email
      let localUser = await db.selectFrom('fc_users').selectAll().where('email', '=', primaryEmail).executeTakeFirst();

      if (!localUser) {
        // 1. Check Registration Policy
        const signupEnabled = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_enabled').executeTakeFirst();
        const defaultRole = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_default_role').executeTakeFirst();
        const domainRulesRaw = await db.selectFrom('options').select('value').where('name', '=', 'flare:signup_domain_rules').executeTakeFirst();
        
        const isEnabled = signupEnabled?.value === 'true';
        const roleDefault = defaultRole?.value || 'editor';
        const domainRules = JSON.parse(domainRulesRaw?.value || '{}') as Record<string, string>;

        if (!isEnabled) {
          throw new Error('Signups are currently disabled');
        }

        // Determine role based on domain
        const domain = primaryEmail.split('@')[1];
        const assignedRole = domainRules[domain] || roleDefault;

        // Provision new user
        localUser = {
          id: ulid(),
          email: primaryEmail,
          password: null,
          role: assignedRole,
          disabled: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await db.insertInto('fc_users').values(localUser as any).execute();
      }

      // Link Account
      await db.insertInto('fc_oauth_accounts')
        .values({
          provider_id: 'github',
          provider_user_id: githubId,
          user_id: localUser.id
        })
        .execute();

      user = localUser as any;
    }

    if (user!.disabled) return apiResponse.error(c, 'Account is disabled', 403);

    // 5. Create Session
    const sessionId = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insertInto('fc_sessions')
      .values({
        id: sessionId,
        user_id: user!.id,
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

    return c.redirect('/admin'); // Assuming frontend handles redirect logic to dashboard
  } catch (error: any) {
    return apiResponse.error(c, error.message);
  }
});

