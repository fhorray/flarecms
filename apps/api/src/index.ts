import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, setupMiddleware } from './middlewares/auth';
import { corsMiddleware } from './middlewares/cors';

import { authRoutes } from './routes/auth';
import { setupRoutes } from './routes/setup';
import { collectionsRoutes } from './routes/collections';
import { contentRoutes } from './routes/content';
import { tokenRoutes } from './routes/tokens';
import { deviceRoutes } from './routes/device';
import { magicRoutes } from './routes/magic';
import { oauthRoutes } from './routes/oauth';
import { settingsRoutes } from './routes/settings';
import { mcpRoutes } from './routes/mcp';
import { apiResponse } from './lib/response';
import type { D1Database, KVNamespace, Fetcher } from "@cloudflare/workers-types";

export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export type Variables = {
  user: { id: string; email: string; role: string };
  scopes: string[];
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', corsMiddleware);

// Auth Middlewares
app.use('/api/*', setupMiddleware);
app.use('/api/*', authMiddleware);

// API Group
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

api.route('/auth', authRoutes);
api.route('/setup', setupRoutes);
api.route('/collections', collectionsRoutes);
api.route('/content', contentRoutes);
api.route('/tokens', tokenRoutes);
api.route('/device', deviceRoutes);
api.route('/magic', magicRoutes);
api.route('/oauth', oauthRoutes);
api.route('/settings', settingsRoutes);
api.route('/mcp', mcpRoutes);

api.get('/health', (c) => apiResponse.ok(c, { status: 'ok' }));

app.route('/api', api);

// Serve Static Assets & SPA Fallback
app.get('*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);

  // If the asset is not found (404), serve index.html for SPA routing
  if (res.status === 404) {
    const url = new URL(c.req.url);
    url.pathname = '/index.html';
    return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
  }

  return res;
});

export default app;
