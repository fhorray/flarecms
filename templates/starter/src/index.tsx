import { Hono } from 'hono';
import { reactRenderer } from '@hono/react-renderer';
import { flarecms } from 'flarecms';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

// Serve static assets via Cloudflare Assets binding
app.get('/index.css', (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.notFound();
});

// Default Site Layout with Tailwind v4 Browser CDN
app.use(
  '*',
  reactRenderer(({ children }) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>My FlareCMS Site</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <link rel="stylesheet" type="text/tailwindcss" href="/index.css" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen">
          <main className="container mx-auto px-4 py-12">{children}</main>
        </body>
      </html>
    );
  }),
);

// 1. Mount FlareCMS Dashboard and API
// This will handle /admin/* and /api/*
app.route('/', flarecms({ base: '/admin' }));

// 2. Add your own routes
app.get('/', (c) => {
  return c.render(
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to <span className="text-zinc-500">FlareCMS</span>
        </h1>
        <p className="text-xl text-zinc-600">
          Your new site is ready. Start building your content or manage it in
          the dashboard.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <a href="/admin" className="btn btn-primary">
          Go to Admin
        </a>
        <a
          href="https://flarecms.francy.dev"
          target="_blank"
          className="btn border border-zinc-200 hover:bg-zinc-100"
        >
          Documentation
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-12">
        <div className="card text-left">
          <h3 className="font-bold mb-2">Modern Stack</h3>
          <p className="text-sm text-zinc-500">
            Built with Hono, Cloudflare D1, and Tailwind v4. Deploy in seconds.
          </p>
        </div>
        <div className="card text-left">
          <h3 className="font-bold mb-2">Zero Config</h3>
          <p className="text-sm text-zinc-500">
            No build steps required for Tailwind. Just write your classes and
            deploy.
          </p>
        </div>
      </div>
    </div>,
  );
});

export default app;
