import { Hono } from 'hono';
import { createFlareAPI } from 'flarecms/server';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 1. Mount the FlareCMS modular API
// This handles all CMS backend logic like auth, collections, and content management.
app.route('/api', createFlareAPI({ base: '/admin' }));

// 2. Production Asset Serving & SPA Routing
// This handles serving the React frontend and ensuring SPA routes work.
app.get('*', async (c) => {
  // Use the ASSETS binding to serve static files from /dist
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    
    // If the file is not found (404), we fallback to index.html for SPA routing.
    // This allows routes like /admin or /posts/123 to load the React app correctly.
    if (res.status === 404) {
      return c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
    }
    
    return res;
  }

  // Fallback for Development Environment
  // Vite dev server handles most things, but we provide a shell if needed.
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
