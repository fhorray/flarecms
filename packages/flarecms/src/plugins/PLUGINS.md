# FlareCMS Plugin System

A secure, sandboxed plugin architecture for extending FlareCMS with custom functionality. Plugins can intercept content operations, expose custom API routes, and store their own isolated data — all within a strict capability-based security model.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Creating a Plugin](#creating-a-plugin)
- [Registering a Plugin](#registering-a-plugin)
- [Capabilities](#capabilities)
- [Hooks](#hooks)
- [Custom Routes](#custom-routes)
- [Plugin Context](#plugin-context)
- [Isolated Storage](#isolated-storage)
- [HTTP Fetch](#http-fetch)
- [Logging](#logging)
- [Security Model](#security-model)
- [Execution Modes](#execution-modes)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Limitations](#limitations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FlareCMS Host                     │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Hono API   │───▶│     Plugin Manager       │   │
│  │  (content   │    │  ┌────────┐ ┌─────────┐  │   │
│  │  CRUD etc.) │    │  │ Hooks  │ │ Routes  │  │   │
│  └─────────────┘    │  └────────┘ └─────────┘  │   │
│                     └──────────┬───────────────┘   │
│                                │                    │
│          ┌─────────────────────┤                    │
│          ▼                     ▼                    │
│   ┌─────────────┐    ┌──────────────────┐          │
│   │  Trusted    │    │ Plugin Bridge    │          │
│   │  Plugin     │    │ (RPC Gateway)    │          │
│   │ (in-process)│    └────────┬─────────┘          │
│   └─────────────┘             │                    │
│                                ▼                    │
│                       ┌──────────────────┐          │
│                       │ Sandboxed Plugin │          │
│                       │ (V8 Isolate)     │          │
│                       └──────────────────┘          │
└─────────────────────────────────────────────────────┘
```

The plugin system is built on three principles:
1. **Least privilege** — plugins only get the capabilities they explicitly declare.
2. **Data isolation** — each plugin's data is strictly scoped by its `plugin_id`.
3. **Non-blocking** — after-hooks run asynchronously and never delay the HTTP response.

---

## Creating a Plugin

Use the `definePlugin()` helper to define your plugin with full TypeScript inference:

```typescript
// my-plugin/index.ts
import { definePlugin } from 'flarecms/plugins';

export default definePlugin({
  hooks: {
    'content:beforeSave': async (event, ctx) => {
      // Modify content before it's saved to the database
      const data = event as { content: Record<string, unknown>; collection: string; isNew: boolean };

      if (data.collection === 'posts' && data.isNew) {
        ctx.log.info('New post being created', { title: data.content['title'] });
        // Auto-generate a reading time estimate
        const body = String(data.content['body'] ?? '');
        data.content['reading_time'] = Math.ceil(body.split(' ').length / 200);
      }

      return data;
    },

    'content:afterSave': async (event, ctx) => {
      // React to content saves (runs asynchronously)
      const data = event as { content: Record<string, unknown>; collection: string };
      await ctx.kv.set(`last-save:${data.collection}`, new Date().toISOString());
    },
  },

  routes: {
    stats: {
      public: false,
      handler: async (routeCtx, ctx) => {
        const lastSave = await ctx.kv.get('last-save:posts');
        return { lastSave, pluginId: ctx.plugin.id };
      },
    },
  },
});
```

---

## Registering a Plugin

Plugins are registered when creating the FlareCMS API in your `worker.ts` (or equivalent entrypoint):

```typescript
// worker.ts
import { createFlareAPI } from 'flarecms/server';
import myPlugin from './my-plugin';

const api = createFlareAPI({
  base: '/admin',
  plugins: [
    {
      id: 'my-plugin',
      version: '1.0.0',
      format: 'standard',
      entrypoint: './my-plugin/index.ts',
      capabilities: ['read:content', 'write:content'],
      allowedHosts: ['api.example.com'],
      storage: {
        analytics: { indexes: ['date'] },
      },
    },
  ],
});

export default api;
```

### Plugin Descriptor Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier (e.g., `"seo-toolkit"`) |
| `version` | `string` | ✅ | Semantic version string |
| `format` | `"standard"` | ✅ | Must be `"standard"` (reserved for future formats) |
| `entrypoint` | `string` | ✅ | Module path to the plugin backend |
| `capabilities` | `PluginCapability[]` | — | List of permissions the plugin needs |
| `allowedHosts` | `string[]` | — | Hostnames the plugin can `fetch()` |
| `storage` | `Record<string, {...}>` | — | Named storage collections the plugin needs |
| `adminPages` | `Array<{...}>` | — | Admin UI pages (for future dashboard integration) |

---

## Capabilities

Capabilities are the permission system. A plugin can only access what it explicitly declares.

```typescript
type PluginCapability =
  | 'read:content'     // Read documents from any collection
  | 'write:content'    // Create, update, delete documents
  | 'read:media'       // Read media files (future)
  | 'write:media'      // Upload/delete media files (future)
  | 'network:fetch'    // Fetch external URLs (restricted to allowedHosts)
  | 'network:fetch:any'// Fetch any URL (no host restriction — use carefully!)
  | 'read:users'       // Read user data
  | 'email:send';      // Send emails (future)
```

> **Security note**: Never grant more capabilities than necessary. Prefer `network:fetch` + a specific `allowedHosts` list over `network:fetch:any`.

---

## Hooks

Hooks allow plugins to intercept and react to CMS operations. There are three hook patterns:

### Waterfall (before-hooks)
Each plugin receives the result of the previous. Plugins can modify the data.

```typescript
'content:beforeSave': async (event, ctx) => {
  const data = event as { content: Record<string, unknown>; collection: string; isNew: boolean };

  // Sanitize HTML in body field
  if (typeof data.content['body'] === 'string') {
    data.content['body'] = data.content['body'].replace(/<script[^>]*>.*?<\/script>/gi, '');
  }

  return data; // Important: always return the modified event
},
```

### Parallel (after-hooks)
Runs all matching hooks at the same time. Great for side effects. Errors are caught and logged but do NOT affect the response.

```typescript
'content:afterSave': async (event, ctx) => {
  const data = event as { content: Record<string, unknown>; collection: string };
  // Trigger a webhook
  await ctx.http?.fetch('https://hooks.example.com/cms-update', {
    method: 'POST',
    body: JSON.stringify({ collection: data.collection }),
    headers: { 'Content-Type': 'application/json' },
  });
},
```

### Veto (before-delete)
Any plugin returning `false` will **abort** the operation with a 403 error.

```typescript
'content:beforeDelete': async (event, ctx) => {
  const data = event as { id: string; collection: string };

  // Prevent deleting posts that have been published for more than 30 days
  const doc = await ctx.content?.get(data.collection, data.id);
  const published = doc as Record<string, unknown> | undefined;

  if (published?.['published_at']) {
    const age = Date.now() - new Date(String(published['published_at'])).getTime();
    if (age > 30 * 24 * 60 * 60 * 1000) {
      ctx.log.warn('Deletion blocked — post is older than 30 days');
      return false; // Abort the deletion
    }
  }

  return true; // Allow deletion
},
```

### Available Hooks

| Hook | Pattern | Triggered When |
|------|---------|----------------|
| `content:beforeSave` | Waterfall | Before a document is created or updated |
| `content:afterSave` | Parallel | After a document is saved (async) |
| `content:beforeDelete` | Veto | Before a document is deleted |
| `content:afterDelete` | Parallel | After a document is deleted (async) |

### Hook Priority

Hooks support priority ordering. Lower numbers run first (default: `100`).

```typescript
'content:beforeSave': {
  priority: 10, // Runs before other plugins with default priority 100
  timeout: 3000, // Max 3s execution time (default: 5000ms)
  handler: async (event, ctx) => {
    // ...
  },
},
```

---

## Custom Routes

Plugins can expose HTTP endpoints accessible via the FlareCMS API:

```
GET  /api/plugins/:pluginId/routes
POST /api/plugins/:pluginId/routes/:routeName
```

### Defining a Route

```typescript
routes: {
  // Route name: accessible at POST /api/plugins/my-plugin/routes/search  
  search: {
    public: false, // Requires authentication
    handler: async (routeCtx, ctx) => {
      const query = (routeCtx.input as { q?: string })?.q ?? '';

      const results = await ctx.storage['analytics'].query({ limit: 10 });

      return {
        query,
        results: results.items,
        meta: {
          pluginId: ctx.plugin.id,
          siteUrl: ctx.site.url,
        },
      };
    },
  },
},
```

### Route Context (`routeCtx`)

The first argument to route handlers:

```typescript
interface RouteCtx {
  input: unknown;          // Parsed JSON body from the request
  request: SerializedRequest; // URL, method, headers
  requestMeta: RequestMeta;   // IP, userAgent, referer
}
```

---

## Plugin Context

The second argument to all hooks and route handlers — your gateway to the outside world.

```typescript
interface PluginContext {
  plugin: { id: string; version: string };  // Plugin identity
  kv: PluginKV;                             // Key-value storage
  storage: Record<string, PluginStorageCollection>; // Named collections
  content?: PluginContentAccess;            // CMS content (requires capability)
  http?: PluginHttpAccess;                  // External HTTP (requires capability)
  log: PluginLogger;                        // Structured logging
  site: { name: string; url: string; locale: string }; // Site metadata
  users?: PluginUsersAccess;                // User data (requires capability)
}
```

---

## Isolated Storage

Every plugin has two storage mechanisms, both automatically scoped to the plugin's `plugin_id`.

### KV Store

Simple key-value store. No declaration needed.

```typescript
// Write
await ctx.kv.set('config:enabled', true);
await ctx.kv.set('user:42:preferences', { theme: 'dark', locale: 'en' });

// Read
const enabled = await ctx.kv.get('config:enabled');

// Delete
await ctx.kv.delete('config:enabled');

// List with optional prefix
const allUserPrefs = await ctx.kv.list('user:');
// Returns: [{ key: 'user:42:preferences', value: { theme: 'dark', ... } }, ...]
```

### Storage Collections

Structured collections for more complex data. Must be declared in the plugin descriptor.

```typescript
// Descriptor
storage: {
  page_views: { indexes: ['url', 'date'] },
  events: {},
}

// Usage
const views = ctx.storage['page_views'];

// Put a record
await views.put('landing-2024-01-01', { url: '/landing', date: '2024-01-01', count: 1204 });

// Get a record
const record = await views.get('landing-2024-01-01');

// Query with limit
const recent = await views.query({ limit: 5 });
// Returns: { items: [...], hasMore: boolean }

// Count total records
const total = await views.count();

// Delete a record
await views.delete('landing-2024-01-01');
```

> **Important**: You can only access storage collections you declared in the plugin descriptor. Attempting to access an undeclared collection throws an error.

---

## HTTP Fetch

Make external HTTP requests (requires `network:fetch` capability):

```typescript
// Declare which hosts you'll call
{
  capabilities: ['network:fetch'],
  allowedHosts: ['api.openai.com', 'hooks.slack.com'],
}

// Then in your hook/route:
const response = await ctx.http!.fetch('https://api.openai.com/v1/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_KEY}`, // Don't do this — use bindings
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: '...', max_tokens: 100 }),
});

if (response.ok) {
  const data = await response.json();
}
```

> ⚠️ **Security**: Plugins cannot access the Worker's `env` bindings directly. If you need secrets, you must pass them through the host integration layer purposefully. Never hardcode secrets.

---

## Logging

Use the context logger for structured output. All log entries are automatically prefixed with `[plugin-id]`.

```typescript
ctx.log.debug('Processing started', { documentId: 'abc123' });
ctx.log.info('Content analyzed', { wordCount: 450 });
ctx.log.warn('Slow external API', { responseTime: 4200 });
ctx.log.error('Failed to post webhook', { statusCode: 503 });
```

---

## Security Model

### What plugins CAN'T access

- ❌ The D1 database object directly
- ❌ The Worker's `env` bindings (secrets, KV namespaces, R2 buckets)
- ❌ Other plugins' storage data
- ❌ Arbitrary network hosts (unless `network:fetch:any` is granted)
- ❌ File system (there is none in Cloudflare Workers)
- ❌ Global `process.env`

### Sandboxed vs Trusted

| Mode | Isolation | Performance | Availability |
|------|-----------|-------------|--------------|
| Trusted (in-process) | None — runs in host process | Fastest | Always |
| Sandboxed (V8 Isolate) | Full V8 isolation | ~50ms CPU limit | Requires Cloudflare Enterprise |

Currently, plugins run as **trusted** in-process plugins. Sandbox mode is fully architected and ready for when your Cloudflare plan supports the Worker Loader API.

### Data Scoping

All storage operations (KV and collections) are automatically prefixed with `plugin_id` at the database level. A plugin can **never** read or write another plugin's data, even if it knows the keys.

---

## Best Practices

### ✅ Do

```typescript
// Always return the event in waterfall hooks
'content:beforeSave': async (event, ctx) => {
  const data = event as { content: Record<string, unknown> };
  data.content['processed_at'] = new Date().toISOString();
  return data; // ✅ Return it!
},

// Use type assertions clearly and safely
'content:afterSave': async (event, ctx) => {
  const { content, collection } = event as {
    content: Record<string, unknown>;
    collection: string;
    isNew: boolean;
  };
  // ...
},

// Use ctx.log instead of console.log
ctx.log.info('Processing complete', { count: results.length });

// Declare only the capabilities you need
capabilities: ['read:content'], // ✅ Not ['read:content', 'write:content'] if you only read
```

### ❌ Don't

```typescript
// Don't forget to return in a waterfall hook!
'content:beforeSave': async (event, ctx) => {
  (event as any).content.title = 'Modified';
  // ❌ Missing return — the modification is lost!
},

// Don't throw errors in after-hooks (they're swallowed anyway, but it's confusing)
'content:afterSave': async (event, ctx) => {
  throw new Error('Something failed'); // ❌ Use ctx.log.error instead
},

// Don't do heavy work in beforeSave without declaring a timeout
'content:beforeSave': {
  handler: async (event, ctx) => {
    await verySlowOperation(); // ❌ Will hit the 5s default timeout
  },
  timeout: 15000, // ✅ Increase if you know it takes longer
},

// Don't use network:fetch:any unless absolutely necessary
capabilities: ['network:fetch:any'], // ❌ Too broad
capabilities: ['network:fetch'],     // ✅ Pair with allowedHosts
allowedHosts: ['specific-api.com'],
```

---

## API Reference

### `definePlugin(definition)`

Identity function that provides full TypeScript inference for plugin definitions.

```typescript
import { definePlugin } from 'flarecms/plugins';

export default definePlugin({
  hooks: { ... },
  routes: { ... },
});
```

### `adaptEntry(definition, descriptor)`

Normalizes a plugin definition + descriptor into a `ResolvedPlugin`. Used internally but exposed for advanced use cases.

### `pluginMiddleware(plugins?)`

Hono middleware that initializes the `PluginManager` for each request. Automatically called by `createFlareAPI()`.

### `PluginManager`

Central orchestrator. Exposed in the Hono context as `c.get('pluginManager')`.

```typescript
manager.runContentBeforeSave(content, collection, isNew)
manager.runContentAfterSave(content, collection, isNew)
manager.runContentBeforeDelete(id, collection)
manager.runContentAfterDelete(id, collection)
manager.invokeRoute(pluginId, routeName, options)
manager.getActivePlugins()
manager.isActive(pluginId)
```

### HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/plugins` | List all active plugins |
| `GET` | `/api/plugins/:id/routes` | List routes for a plugin |
| `POST` | `/api/plugins/:id/routes/:routeName` | Invoke a plugin route |

---

## Limitations

| Feature | Status |
|---------|--------|
| Content hooks (CRUD) | ✅ Fully implemented |
| Custom API routes | ✅ Fully implemented |
| KV storage | ✅ Fully implemented |
| Storage collections | ✅ Fully implemented |
| HTTP fetch | ✅ Fully implemented |
| Logging | ✅ Fully implemented |
| User access | ✅ Fully implemented |
| Sandbox (V8 Isolate) | 🏗️ Architecture ready, requires CF Enterprise |
| Media access (R2) | 🔮 Interface defined, not yet implemented |
| Email sending | 🔮 Interface defined, not yet implemented |
| Cron tasks | 🔮 Table exists, scheduler not yet implemented |
| Admin UI | 🔮 Backend ready, no UI yet |
| Plugin marketplace | 🔮 Planned |

---

## Example: SEO Toolkit Plugin

A complete, real-world example demonstrating multiple features:

```typescript
import { definePlugin } from 'flarecms/plugins';

export default definePlugin({
  hooks: {
    // Auto-generate SEO fields on save
    'content:beforeSave': {
      priority: 50, // Run early
      handler: async (event, ctx) => {
        const data = event as {
          content: Record<string, unknown>;
          collection: string;
          isNew: boolean;
        };

        if (data.collection !== 'posts') return data;

        const title = String(data.content['title'] ?? '');
        const body = String(data.content['body'] ?? '');

        // Auto-fill SEO title if not set
        if (!data.content['seo_title']) {
          data.content['seo_title'] = title.substring(0, 60);
        }

        // Auto-fill SEO description if not set
        if (!data.content['seo_description']) {
          data.content['seo_description'] = body.substring(0, 155) + '...';
        }

        // Calculate word count
        data.content['word_count'] = body.split(/\s+/).filter(Boolean).length;

        ctx.log.debug('SEO fields generated', { title });
        return data;
      },
    },

    // Track edited posts in plugin storage
    'content:afterSave': async (event, ctx) => {
      const { content, collection, isNew } = event as {
        content: Record<string, unknown>;
        collection: string;
        isNew: boolean;
      };

      await ctx.kv.set(`last-edit:${collection}`, {
        id: content['id'],
        timestamp: new Date().toISOString(),
        isNew,
      });
    },
  },

  routes: {
    // GET /api/plugins/seo-toolkit/routes/report
    report: {
      handler: async (routeCtx, ctx) => {
        const lastEdit = await ctx.kv.get('last-edit:posts');
        const postCount = await ctx.content?.list('posts', { limit: 1 });

        return {
          plugin: ctx.plugin.id,
          site: ctx.site.name,
          lastEdit,
          postCount: postCount?.hasMore ? '1+' : (postCount?.items.length ?? 0),
        };
      },
    },
  },
});
```
