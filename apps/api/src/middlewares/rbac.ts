import type { Context, Next } from 'hono';
import { createDb } from '@flare/db';

/**
 * Ensures the authenticated user has one of the allowed roles.
 * Must be used AFTER authMiddleware.
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden', requiredRoles: allowedRoles }, 403);
    }

    return next();
  };
};

export const requireScope = (action: string, resourceOrParamName: string = '*') => {
  return async (c: Context, next: Next) => {
    // Determine the actual resource ID (e.g. from param)
    const resource = resourceOrParamName.startsWith(':') || resourceOrParamName === 'collection_slug'
      ? c.req.param(resourceOrParamName.replace(':', '')) || c.req.param('collection')
      : resourceOrParamName;

    // Check if collection is public (only for 'read' action) - DO THIS FIRST for anonymous access
    if (action === 'read' && resource) {
      const db = createDb(c.env.DB);
      const collection = await db.selectFrom('fc_collections')
        .select('is_public')
        .where('slug', '=', resource)
        .executeTakeFirst();
      
      if (collection && collection.is_public === 1) {
        return next();
      }
    }

    const scopes = c.get('scopes');

    if (!scopes || !Array.isArray(scopes)) {
      return c.json({ error: 'Unauthorized', code: 'NO_SCOPES' }, 401);
    }

    // Fast path: Full access
    if (scopes.includes('*')) {
      return next();
    }

    if (!scopes || !Array.isArray(scopes)) {
      return c.json({ error: 'Unauthorized', code: 'NO_SCOPES' }, 401);
    }

    // Check for granular match
    const hasPermission = scopes.some((s: any) => {
      // Handle legacy string scopes (e.g. "content:read")
      if (typeof s === 'string') {
        return s === `${resource}:${action}` || s === `*:${action}` || s === `${resource}:*`;
      }
      
      // Handle new structured scopes { resource: "posts", actions: ["read"] }
      if (typeof s === 'object' && s !== null) {
        const matchesResource = s.resource === '*' || s.resource === resource;
        const matchesAction = s.actions?.includes('*') || s.actions?.includes(action);
        return matchesResource && matchesAction;
      }

      return false;
    });

    if (!hasPermission) {
      return c.json({ 
        error: 'Forbidden: Insufficient API Token Scope', 
        required: { action, resource } 
      }, 403);
    }

    return next();
  };
};
