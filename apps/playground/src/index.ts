import { Hono } from 'hono';
import { createFlareAPI } from 'flarecms/server';
import uiKitTester from '@flarecms/plugin-ui-kit-tester';
import webhooks from '@flarecms/plugin-webhooks';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 1. Mount the FlareCMS modular API
// This handles all CMS backend logic like auth, collections, and content management.
app.route('/api', createFlareAPI({
  base: '/admin', plugins: [
    uiKitTester,
    webhooks
  ]
}));

  app.get('*', async (c) => {
  // 1. Production Asset Serving (Cloudflare Pages)
  // We try to serve the static file from ASSETS, but we skip this in development
  // to avoid conflicts with Vite's own asset serving.
  if (c.env.ASSETS && process.env.NODE_ENV === 'production') {
    try {
      const res = await c.env.ASSETS.fetch(c.req.url);
      if (res.status !== 404) return res;
    } catch {
      // Fallback
    }
  }

  // 2. SPA / Development Fallback
  // We return the main HTML shell. In production, this serves as the entry point
  // for the React app. In development, Vite handles hot-reloading.
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FlareCMS Site (Dev)</title>
        <script type="module">
          import { injectIntoGlobalHook } from "/@react-refresh";
          injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <link rel="stylesheet" href="/src/index.css">
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/client.tsx"></script>
      </body>
    </html>
  `);
});

export default app;
