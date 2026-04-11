import { Hono } from 'hono';
import { corsMiddleware } from '../api/middlewares/cors';
import { setupMiddleware, authMiddleware } from '../api/middlewares/auth';
import { authRoutes } from '../api/routes/auth';
import { setupRoutes } from '../api/routes/setup';
import { collectionsRoutes } from '../api/routes/collections';
import { contentRoutes } from '../api/routes/content';
import { tokenRoutes } from '../api/routes/tokens';
import { deviceRoutes } from '../api/routes/device';
import { magicRoutes } from '../api/routes/magic';
import { oauthRoutes } from '../api/routes/oauth';
import { settingsRoutes } from '../api/routes/settings';
import { mcpRoutes } from '../api/routes/mcp';
import { pluginRoutes } from '../api/routes/plugins';
import { pluginMiddleware } from '../plugins/middleware';
import { apiResponse } from '../api/lib/response';
import type { Bindings, Variables } from '../types';
import type { PluginDescriptor, FlarePlugin, SandboxRunnerFactory } from '../plugins/types';

/**
 * Creates the modular FlareCMS API router.
 * This can be mounted into any Hono application.
 * 
 * @example
 * app.route('/api', createFlareAPI({ base: '/admin' }));
 */
export function createFlareAPI(options: { 
  base?: string;
  plugins?: (PluginDescriptor | FlarePlugin)[];
  sandboxRunner?: SandboxRunnerFactory;
} = {}) {
  const base = options.base || '/admin';
  const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // Middlewares
  api.use('*', corsMiddleware);
  api.use('*', pluginMiddleware(options.plugins));
  api.use('*', async (c, next) => {
    // Collect reserved slugs from base and standard system paths
    const adminPrefix = base.replace(/^\//, '') || 'admin';
    c.set('reservedSlugs', [
      adminPrefix,
      'api',
      'setup',
      'auth',
      'login',
      'signup',
      'collections',
      'users',
      'settings',
      'oauth',
    ]);
    await next();
  });

  api.get('/health', (c) => apiResponse.ok(c, { status: 'ok' }));

  api.use('/*', setupMiddleware);
  api.use('/*', authMiddleware);

  // Routes
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
  api.route('/plugins', pluginRoutes);

  return api;
}
