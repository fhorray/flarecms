# FlareCMS Plugin System

A secure, sandboxed plugin architecture for extending FlareCMS with custom functionality. Plugins can intercept content operations, expose custom API routes, and build full administrative UIs — all within a strict capability-based security model.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Defining a Plugin](#defining-a-plugin)
- [Administrative UI (Block Kit)](#administrative-ui-block-kit)
- [Custom React Components](#custom-react-components)
- [Capabilities & Security](#capabilities--security)
- [Hooks (Event System)](#hooks)
- [Custom API Routes](#custom-api-routes)
- [Plugin Context](#plugin-context)
- [Isolated Storage](#isolated-storage)
- [Best Practices](#best-practices)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FlareCMS Host                     │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Admin UI   │    │     Plugin Manager       │   │
│  │(React/Vite) │◀──▶│  ┌────────┐ ┌─────────┐  │   │
│  └─────────────┘    │  │ Hooks  │ │ Routes  │  │   │
│                     │  └────────┘ └─────────┘  │   │
│                     └──────────┬───────────────┘   │
│                                │                    │
│          ┌─────────────────────┤                    │
│          ▼                     ▼                    │
│   ┌─────────────┐    ┌──────────────────┐          │
│   │  Trusted    │    │ Block Kit Engine │          │
│   │  Plugin     │    │ (UI Generator)   │          │
│   │ (in-process)│    └────────┬─────────┘          │
│   └─────────────┘             │                    │
│                               ▼                    │
│                       ┌──────────────────┐          │
│                       │ Sandboxed Hub    │          │
│                       │ (Isolate/Worker) │          │
│                       └──────────────────┘          │
└─────────────────────────────────────────────────────┘
```

The system is built on **Least Privilege**: a plugin only sees what it declares.

---

## Defining a Plugin

Use the `definePlugin()` helper to create a unified plugin definition. This single object contains metadata, security rules, and business logic.

```typescript
// plugins/my-plugin/src/index.ts
import { definePlugin } from 'flarecms/plugins';

export default definePlugin({
  id: 'my-plugin',
  name: 'My Extension',
  version: '1.0.0',
  
  // Security permissions
  capabilities: ['read:content', 'network:fetch'],
  
  // Admin UI Navigation
  adminPages: [
    { path: '/', label: 'Overview', icon: 'LayoutDashboard' },
    { path: '/settings', label: 'Configuration', icon: 'Settings' }
  ],

  // Logic
  hooks: {
    'content:afterSave': async (event, ctx) => {
      ctx.log.info('Document saved!', event);
    }
  },

  // Admin UI Handler (Block Kit)
  admin: {
    handler: async (interaction, ctx) => {
      return {
        blocks: [
          { type: 'header', text: 'Plugin Overview', size: 'lg' },
          { type: 'text', text: 'Dashboard content goes here.' }
        ]
      };
    }
  }
});
```

---

## Administrative UI (Block Kit)

FlareCMS uses **Block Kit**, a declarative UI system. Your plugin backend returns a list of blocks, and the CMS renders them safely.

### Interaction Logic
When a user visits your plugin page or clicks a button, the `admin.handler` is invoked with a `BlockInteraction`.

```typescript
admin: {
  handler: async (interaction, ctx) => {
    // 1. Detect if it's an initial page load
    if (interaction.type === 'page_load') {
      if (interaction.page === '/settings') {
        return renderSettingsPage();
      }
    }

    // 2. Detect a button click
    if (interaction.type === 'block_action' && interaction.blockId === 'save-btn') {
      await ctx.kv.set('config', interaction.value);
      return {
        toast: { type: 'success', message: 'Settings saved!' },
        blocks: [...]
      };
    }
  }
}
```

### Supported Blocks
- `header`, `text`, `divider`, `stat`
- `input`, `textarea`, `select`, `toggle`
- `button`, `button_group`
- `table`, `alert`, `card`, `grid`, `form`
- `custom` (Direct React injection)

---

## Custom React Components

For UIs that Block Kit cannot satisfy (like complex charts or interactive maps), you can register a **Custom Block**.

### 1. Create the React Component (Client-side)
```tsx
// plugins/my-plugin/src/client.tsx
import React, { useState } from 'react';

export function MyInteractiveMap({ initialLat, onAction }) {
  const [lat, setLat] = useState(initialLat);

  return (
    <div>
      <p>Current Lat: {lat}</p>
      <button onClick={() => onAction({ type: 'block_action', blockId: 'map-move', value: lat })}>
        Sync with Server
      </button>
    </div>
  );
}
```

### 2. Register the component
In your plugin's client entry point:
```typescript
import { registerPluginBlock } from 'flarecms/client';
import { MyInteractiveMap } from './MyInteractiveMap';

registerPluginBlock('my-map', MyInteractiveMap);
```

### 3. Use in the Backend Handler
```typescript
{
  type: 'custom',
  component: 'my-map',
  props: { initialLat: 45.523 }
}
```

#### The `onAction` Callback
The component receives `onAction` as a prop. Calling it triggers a request to your plugin's `admin.handler`, allowing real-time sync between your custom React UI and your plugin's edge logic.

---

## Capabilities & Security

A plugin must declare everything it intends to access.

| Capability | Description |
|-----------|-------------|
| `read:content` | Access to `ctx.content.get()` and `list()` |
| `write:content` | Access to `ctx.content.create()`, `update()`, `delete()` |
| `network:fetch` | Enables `ctx.http.fetch()` (requires `allowedHosts`) |
| `network:fetch:any` | Enables unrestriced HTTP fetching |
| `read:users` | Access to the system user directory |
| `crypto:encrypt` | Access to `ctx.crypto.encrypt()` and `decrypt()` |

---

## Plugin Context

Every hook and handler receives a `ctx` object:

```typescript
ctx.kv      // Isolated key-value store (LevelDB/Cloudflare KV)
ctx.log     // Structured logger (info, warn, error, debug)
ctx.storage // Named SQL-like storage collections
ctx.site    // Site title, URL, and locale settings
ctx.content // (Requires capability) Access to CMS documents
ctx.http    // (Requires capability) Fetch external APIs
ctx.crypto  // (Requires capability) Secure encryption/decryption
```

---

## Isolated Storage

Plugins have two ways to persist data, both automatically isolated.

### KV Store (Quick Data)
```typescript
await ctx.kv.set('counter', 1);
const val = await ctx.kv.get('counter');
```

### Collections (Indexed Data)
Must be declared in the registration:
```typescript
storage: {
  analytics: { indexes: ['timestamp'] }
}
```
Usage:
```typescript
await ctx.storage.analytics.put('row-1', { timestamp: Date.now(), event: 'click' });
```

---

## Sensitive Data Encryption

For plugins handling sensitive information (like API keys), FlareCMS provides a system-level encryption bridge using the site's `AUTH_SECRET`.

### Usage
Requires the `crypto:encrypt` capability.

```typescript
// Encrypt sensitive data before storing in KV
const encrypted = await ctx.crypto.encrypt(rawApiKey);
await ctx.kv.set('config', { encryptedKey: encrypted });

// Decrypt when needed
const rawKey = await ctx.crypto.decrypt(config.encryptedKey);
```

> [!IMPORTANT]
> Encryption is tied to the system secret. If the host environment's secret changes, old encrypted data will become undecipherable.

---

## Best Practices

1. **Keep it Pure**: Plugin handlers should be stateless where possible. Use `ctx.kv` for persistence.
2. **Handle Errors gracefully**: Use `ctx.log.error` instead of throwing to avoid crashing the request cycle.
3. **Waterfall Rules**: In `beforeSave` hooks, **always** return the modified event object.
4. **HMR Support**: FlareCMS supports Hot Module Replacement for plugins during development. Any change to your `admin.handler` will refresh the Admin UI automatically.
