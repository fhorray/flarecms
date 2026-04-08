import type { Context, Next } from 'hono';

// For the MCP, we use a shared secret for JWT or simple token verification
// In a real app, this would be a proper session in KV or D1.
// We'll use a simple static token from environment for now to keep it ultra-light
// but the middleware is ready for dynamic expansion.

export const authMiddleware = async (c: Context, next: Next) => {
  const secret = (c.env as any).AUTH_SECRET || 'flarecms-secret-123';
  
  // Skip auth for login and assets
  if (c.req.path === '/api/auth/login' || !c.req.path.startsWith('/api')) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  // Verification logic (simplified for MCP)
  if (token !== secret) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  return next();
};
