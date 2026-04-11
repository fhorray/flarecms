import { Hono } from 'hono';
import { createFlareAPI } from 'flarecms/server';
import myPlugin from '{{PLUGIN_PACKAGE_NAME}}';

const app = new Hono();

// Mount the FlareCMS modular API
// This handles all CMS backend logic like auth, collections, and content management.
app.route('/api', createFlareAPI({
  plugins: [
    myPlugin
  ]
}));

// Fallback for SPA frontend initialization
app.get('*', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{{PLUGIN_NAME_HUMAN}} Starter</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/client.tsx"></script>
      </body>
    </html>
  `);
});

export default app;
