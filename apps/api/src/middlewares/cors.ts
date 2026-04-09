import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
});
