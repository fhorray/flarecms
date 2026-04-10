import type { PluginManifest } from '../types.js';

/**
 * Generates the JavaScript wrapper code that runs inside the Worker Isolate.
 * It sets up the RPC bridge to the host and provides the PluginContext.
 */
export function generatePluginWrapper(manifest: PluginManifest): string {
	return `
import { WorkerEntrypoint } from 'cloudflare:workers';
import plugin from './sandbox-plugin.js';

/**
 * Creates a proxied PluginContext that redirects calls to the Host BRIDGE.
 */
function createContext(env) {
  const bridge = env.BRIDGE;
  
  const log = {
    debug: (msg, data) => bridge.log('debug', msg, data),
    info: (msg, data) => bridge.log('info', msg, data),
    warn: (msg, data) => bridge.log('warn', msg, data),
    error: (msg, data) => bridge.log('error', msg, data),
  };

  const kv = {
    get: (key) => bridge.kvGet(key),
    set: (key, value) => bridge.kvSet(key, value),
    delete: (key) => bridge.kvDelete(key),
    list: (prefix) => bridge.kvList(prefix),
  };

  const storage = new Proxy({}, {
    get: (_, col) => ({
      get: (id) => bridge.storageGet(col, id),
      put: (id, data) => bridge.storagePut(col, id, data),
      delete: (id) => bridge.storageDelete(col, id),
      query: (opts) => bridge.storageQuery(col, opts),
    })
  });

  const content = {
    get: (col, id) => bridge.contentGet(col, id),
    list: (col, opts) => bridge.contentList(col, opts),
    create: (col, data) => bridge.contentCreate(col, data),
    update: (col, id, data) => bridge.contentUpdate(col, id, data),
    delete: (col, id) => bridge.contentDelete(col, id),
  };

  const http = {
    fetch: async (url, init) => {
      // Basic init serialization (headers etc)
      const res = await bridge.httpFetch(url, init);
      return {
        status: res.status,
        ok: res.ok,
        headers: new Headers(res.headers),
        text: async () => res.text,
        json: async () => JSON.parse(res.text),
      };
    }
  };

  return {
    plugin: { id: env.PLUGIN_ID, version: env.PLUGIN_VERSION },
    kv,
    storage,
    content,
    http,
    log,
    site: env.SITE_INFO || { name: 'FlareCMS', url: '', locale: 'en' },
  };
}

export default class extends WorkerEntrypoint {
  async invokeHook(name, event) {
    const hooks = plugin.hooks || {};
    const hook = hooks[name];
    if (!hook) return event;
    
    const handler = typeof hook === 'function' ? hook : hook.handler;
    if (typeof handler !== 'function') return event;

    const ctx = createContext(this.env);
    return await handler(event, ctx);
  }

  async invokeRoute(name, input, request) {
    const routes = plugin.routes || {};
    const route = routes[name];
    if (!route) throw new Error(\`Route "\${name}" not found in plugin.\`);

    const ctx = createContext(this.env);
    return await route.handler({ input, request }, ctx);
  }
}
`;
}
