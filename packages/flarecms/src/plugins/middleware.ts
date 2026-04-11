import type { MiddlewareHandler } from 'hono';
import { PluginManager } from './manager';
import { adaptEntry } from './adapt-entry';
import { createDb } from '../db/index';
import type { FlarePlugin, PluginDescriptor } from './types';

/**
 * Hono middleware to initialize the PluginManager.
 * 
 * @param staticPlugins - Plugins declared at build-time/config.
 */
export function pluginMiddleware(staticPlugins: (PluginDescriptor | FlarePlugin)[] = []): MiddlewareHandler {
  return async (c, next) => {
    // 1. Resolve 'trusted' plugins (in-process)
    // For now, we only handle static/trusted plugins.
    // Future: Load dynamic plugins from D1 and initialize sandbox runners.
    const resolvedPlugins = staticPlugins.map(p => {
      // If it's a full plugin object, use it. 
      // If it's just a descriptor, it's currently a placeholder 
      // (logic will be loaded by sandbox runners later if implemented).
      return adaptEntry(p as FlarePlugin);
    });

    if (!c.env?.DB) return await next();
    
    const db = createDb(c.env.DB);
    const siteInfo = {
      name: 'FlareCMS',
      url: new URL(c.req.url).origin,
      locale: 'en',
    };

    const encryptionSecret = c.env.FLARE_ENCRYPTION_SECRET || c.env.AUTH_SECRET;
    const manager = new PluginManager(resolvedPlugins, db, siteInfo, encryptionSecret);

    // Set the manager in the context for other routes to use
    c.set('pluginManager', manager);

    await next();
  };
}
