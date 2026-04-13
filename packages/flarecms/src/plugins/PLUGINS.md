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
  
  // Logic
  hooks: {
    'content:afterSave': async (event, ctx) => {
      ctx.log.info('Document saved!', event);
    }
  },

  // Admin UI Pages
  pages: [
    { 
      path: '/', 
      label: 'Overview', 
      icon: 'LayoutDashboard',
      render: async (ctx) => {
        return ui.page([
          ui.header('Plugin Overview', { size: 'lg' }),
          ui.text('Dashboard content goes here.', { variant: 'muted' })
        ]);
      }
    }
  ],

  // Admin UI Interactions (Buttons, Forms)
  actions: {
    'save-config': action.define()
      .input(z.object({ token: z.string() }))
      .handler(async ({ input }, ctx) => {
        await ctx.kv.set('token', input.token);
        return ui.response({ toast: ui.toast('success', 'Saved!') });
      })
  }
});
```

---

FlareCMS uses **Block Kit**, a declarative UI system. FlareCMS exports a fluent `ui` builder to make creating interfaces and interactions extremely ergonomic and fully type-safe.

> [!IMPORTANT]
> **No raw `className` injection**: To ensure design system consistency, responsive stability, and security, plugins cannot inject arbitrary CSS classes. Instead, use the provided `variant` and `size` properties.

### Routing (Pages)
Use the `pages` array to define your plugin's navigation and render logic.

```typescript
import { ui } from 'flarecms/plugins';

pages: [
  {
    path: '/settings',
    label: 'Configuration',
    render: async (ctx) => {
      return ui.page([
        ui.header('Settings'),
        ui.form('save-config', { submitLabel: 'Save' }, [
          ui.input('token', 'API Token', { required: true })
        ])
      ]);
    }
  }
]
```

### Handling Interactions (Actions)
When a user clicks a button or submits a form, FlareCMS routes the event to your `actions` dictionary. You can handle basic clicks or use the `action` builder to inject automatic Zod validation for forms.

```typescript
import { action, ui } from 'flarecms/plugins';
import { z } from 'zod';

actions: {
  // 1. Zod Validated Form Submission
  'save-config': action.define()
    .input(z.object({ token: z.string().min(10) }))
    .handler(async ({ input }, ctx) => {
      // `input.token` is strictly typed and validated!
      await ctx.kv.set('token', input.token);
      return ui.redirect('/', { toast: ui.toast('success', 'Token saved.') });
    }),

  // 2. Simple Button Click with Contextual Parameters
  'delete-item': async (interaction, ctx) => {
    // Buttons with ID "delete-item:123" map here automatically
    const itemId = interaction.actionParams?.[0]; 
    
    return ui.response({
      dialog: ui.alertDialog('Delete Item', {
        description: 'Are you sure?',
        confirmText: 'Delete',
        onConfirm: `confirm-delete:${itemId}`
      })
    });
  }
}
```

### Supported UI Blocks

The `ui` builder supports a variety of native CMS components, all standardized via variants and sizes.

#### Layout & Typography
| Component | Key Properties |
|-----------|----------------|
| `ui.header(text, opts)` | `size`: `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `ui.text(text, opts)` | `variant`: `default`, `muted`, `success`, `warning`, `error`, `primary`, `destructive` |
| `ui.divider()` | — |
| `ui.stat(label, value, opts)` | `variant`: `default`, `outline` |

#### Form Controls
| Component | Key Properties |
|-----------|----------------|
| `ui.input(id, label, opts)` | `size`: `default`, `sm`, `lg` |
| `ui.textarea(id, label, opts)` | `size`: `default`, `sm`, `lg` |
| `ui.select(id, label, options, opts)` | `size`: `default`, `sm`, `lg` |
| `ui.toggle(id, label, opts)` | `size`: `default`, `sm`, `lg` |

#### Actions
| Component | Key Properties |
|-----------|----------------|
| `ui.button(id, label, opts)` | `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` <br> `size`: `default`, `sm`, `lg`, `icon`, `icon-sm` |
| `ui.buttonGroup(buttons, opts)` | `variant`: `default`, `outline` |

#### Overlays
| Component | Key Properties |
|-----------|----------------|
| `ui.dialog(title, blocks, opts)` | `size`: `sm`, `md`, `lg`, `xl`, `full` <br> `variant`: `default`, `destructive` |
| `ui.sheet(title, blocks, opts)` | `size`: `sm`, `md`, `lg`, `xl`, `full`, `wide` <br> `side`: `left`, `right`, `top`, `bottom` |
| `ui.alertDialog(title, opts)` | `variant`: `destructive`, `default` |

#### Specialized
- `ui.table(columns, rows, opts)`: Supports `variant` (`default`, `striped`, `bordered`) and `size` (`sm`, `default`).
- `ui.card(blocks, opts)`: Supports `variant` (`default`, `outline`, `secondary`, `ghost`, `accent`).
- `ui.grid(columns, blocks, opts)`: Precise layout control via `columns` and `gap`.
- `ui.custom(component, props)`: Direct React component injection.
- `ui.emptyState(title, description, opts)`: Helper for empty screens.

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
The component receives `onAction` as a prop. Calling it triggers a request to your plugin's `actions`, allowing real-time sync between your custom React UI and your plugin's edge logic.

---

## Custom API Routes

Plugins can expose their own HTTP endpoints. Use the `route` builder to define methods and automatically parse/validate incoming requests using Zod.

```typescript
import { route } from 'flarecms/plugins';
import { z } from 'zod';

routes: {
  'create-charge': route.post()
    .input(z.object({ amount: z.number(), currency: z.string() }))
    .handler(async ({ input, request }, ctx) => {
      // `input` is strictly typed. Invalid requests are automatically rejected with 400 Bad Request.
      const res = await processCharge(input.amount, input.currency);
      return { success: true, chargeId: res.id };
    }),
    
  'get-status': route.get().handler(async (_, ctx) => {
    return { status: 'online' };
  })
}
```

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
4. **HMR Support**: FlareCMS supports Hot Module Replacement for plugins during development. Any change to your `pages` or `actions` will refresh the Admin UI automatically.
