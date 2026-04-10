import type { MiddlewareHandler } from 'hono';
import { PluginManager } from './manager.js';
import { adaptEntry } from './adapt-entry.js';
import { createDb } from '../db/index.js';
import type { FlarePlugin, PluginDescriptor } from './types.js';

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

    const db = createDb(c.env.DB);
    const siteInfo = {
      name: 'FlareCMS',
      url: new URL(c.req.url).origin,
      locale: 'en',
    };

    const manager = new PluginManager(resolvedPlugins, db, siteInfo);

    // Set the manager in the context for other routes to use
    c.set('pluginManager', manager);

    await next();
  };
}
