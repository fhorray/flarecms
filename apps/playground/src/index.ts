import { Hono } from 'hono';
import { createFlareAPI } from 'flarecms/server';
import uiKitTester from '@flarecms/plugin-ui-kit-tester';
import webhooks from '@flarecms/plugin-webhooks';
import stripeConnect from '@flarecms/plugin-stripe-connect';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 1. Mount the FlareCMS modular API
// This handles all CMS backend logic like auth, collections, and content management.
app.route('/api', createFlareAPI({
  base: '/admin', plugins: [
    uiKitTester,
    webhooks,
    stripeConnect
  ]
}));

app.get('*', async (c) => {
  const url = new URL(c.req.url);

  // 1. Production Asset Serving (Cloudflare Pages / Workers Assets)
  if (c.env.ASSETS && process.env.NODE_ENV === 'production') {
    try {
      // First, try to fetch the specific requested path
      let res = await c.env.ASSETS.fetch(c.req.url);

      // If the path is not found (404) or it's a "clean" path (no extension), 
      // we serve the SPA entry point: index.html
      if (res.status === 404 || !url.pathname.includes('.')) {
        res = await c.env.ASSETS.fetch(new URL('/index.html', c.req.url).toString());
      }

      if (res.ok) return res;
    } catch {
      // Fallback to manual response if ASSETS fetch fails
    }
  }

  // 2. SPA / Development Fallback
  // In development, Vite handles hot-reloading using the index.html template.
  // We only return this hardcoded HTML in development as a last resort.
  const isDev = process.env.NODE_ENV !== 'production';

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FlareCMS ${isDev ? '(Dev)' : ''}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        ${isDev ? `
        <script type="module">
          import { injectIntoGlobalHook } from "/@react-refresh";
          injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <link rel="stylesheet" href="/src/index.css">
        ` : ''}
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="${isDev ? '/src/client.tsx' : '/assets/index.js'}"></script>
      </body>
    </html>
  `);
});

export default app;
