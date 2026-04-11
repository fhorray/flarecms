import { Hono } from 'hono';
import { createFlareAPI } from 'flarecms/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const app = new Hono().basePath('/api');

// Mount FlareCMS modular API
// This handles all CMS backend logic like auth, collections, and content management.
app.route('/', createFlareAPI({
  base: '/admin'
}));

const handler = async (req: Request) => {
  const { env } = await getCloudflareContext();
  return app.fetch(req, env);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
