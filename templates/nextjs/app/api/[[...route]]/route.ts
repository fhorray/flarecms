import { handle } from 'hono/nextjs';
import { createFlareAPI } from 'flarecms/server';

// Initialize FlareCMS API
const app = createFlareAPI({ base: '/admin' });

// Export the Next.js App Router handlers
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

// Use the edge runtime for high performance
export const runtime = 'edge';
