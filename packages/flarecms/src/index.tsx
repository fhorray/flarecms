import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';
import App from './dashboard/app';

// API Imports
import { corsMiddleware } from './api/middlewares/cors';
import { setupMiddleware, authMiddleware } from './api/middlewares/auth';
import { authRoutes } from './api/routes/auth';
import { setupRoutes } from './api/routes/setup';
import { collectionsRoutes } from './api/routes/collections';
import { contentRoutes } from './api/routes/content';
import { tokenRoutes } from './api/routes/tokens';
import { deviceRoutes } from './api/routes/device';
import { magicRoutes } from './api/routes/magic';
import { oauthRoutes } from './api/routes/oauth';
import { settingsRoutes } from './api/routes/settings';
import { mcpRoutes } from './api/routes/mcp';
import { apiResponse } from './api/lib/response';
import { dashboardStyles } from './dashboard/styles';
import { dashboardJs } from './dashboard/dist/dashboardJs';

import type { Bindings, Variables } from './types';

export * from './auth';
export * from './db';

/**
 * Creates a unified FlareCMS Hono application that can be mounted
 * into any other Hono-compatible framework (including Next.js).
 */
export function flarecms(options: { base?: string } = {}) {
  const base = options.base || '/admin';
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // Global Middlewares
  app.use('*', corsMiddleware);
  app.use('*', async (c, next) => {
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

  // Setup React Renderer for Admin UI
  app.use(
    `${base}/*`,
    reactRenderer(({ children }) => (
      <html>
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>FlareCMS</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <style
            type="text/tailwindcss"
            dangerouslySetInnerHTML={{ __html: dashboardStyles }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__FLARE_CONFIG__ = { base: "${base}" };`,
            }}
          />
          <script type="module" src="/_flare/assets/main.js"></script>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <div id="root">{children}</div>
        </body>
      </html>
    )),
  );

  // API Middlewares
  app.use('/api/*', setupMiddleware);
  app.use('/api/*', authMiddleware);

  // API Routes
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

  app.get('/_flare/assets/main.js', (c) => {
    return c.body(dashboardJs, 200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  });

  // Admin UI Entry Point
  app.get(`${base}/*`, (c) => c.render(<App />));

  return app;
}
