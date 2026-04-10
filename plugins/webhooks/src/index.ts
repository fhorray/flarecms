import { definePlugin } from 'flarecms/plugins';
import type {
  BlockInteraction,
  BlockResponse,
  PluginContext
} from 'flarecms/plugins';

/**
 * Webhooks & Automations Plugin
 * 
 * Allows users to configure outbound HTTP webhooks triggered by 
 * content lifecycle events (create, update, delete).
 */

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  event: 'all' | 'save' | 'delete';
  active: boolean;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  timestamp: string;
  url: string;
  status: number;
  event: string;
}

export default definePlugin({
  id: 'webhooks',
  name: 'Webhooks & Aut.',
  version: '1.0.0',

  capabilities: [
    'network:fetch',
    'network:fetch:any',
    'read:content'
  ],

  storage: {
    // Stores endpoint configurations
    endpoints: {
      indexes: ['active']
    },
    // Stores delivery history
    logs: {
      indexes: ['timestamp', 'status']
    }
  },

  adminPages: [
    { path: '/', label: 'Overview', icon: 'link' },
    { path: '/logs', label: 'Delivery Logs', icon: 'history' }
  ],

  adminWidgets: [
    { id: 'webhook-stats', title: 'Webhook Health', size: 'half' }
  ],


  hooks: {
    /**
     * Triggered every time a document is saved (created or updated).
     */
    'content:afterSave': async (event, ctx) => {
      await triggerWebhooks('save', event, ctx);
    },

    /**
     * Triggered before a document is deleted.
     */
    'content:afterDelete': async (event, ctx) => {
      await triggerWebhooks('delete', event, ctx);
    }
  },

  admin: {
    handler: async (interaction: BlockInteraction, ctx: PluginContext): Promise<BlockResponse> => {
      const { type } = interaction;

      // ─── Dashboard Widget ──────────────────────────────────────────────────
      if (type === 'page_load' && interaction.page === '__widget__/webhook-stats') {
        const logsStore = ctx.storage['logs'];
        if (!logsStore) return { blocks: [{ type: 'text', text: 'Logs storage unreachable' }] };

        const logs = await logsStore.query({ limit: 50 }) as { items: DeliveryLog[] };
        const successCount = logs.items.filter((l) => l.status >= 200 && l.status < 300).length;
        const total = logs.items.length;
        const rate = total > 0 ? Math.round((successCount / total) * 100) : 100;

        return {
          blocks: [
            {
              type: 'grid',
              columns: 2,
              blocks: [
                { type: 'stat', label: 'Success Rate (Last 50)', value: `${rate}%` },
                { type: 'stat', label: 'Total Deliveries', value: total }
              ]
            }
          ]
        };
      }

      // ─── Overview Page: List Webhooks ──────────────────────────────────────
      if (type === 'page_load' && interaction.page === '/') {
        return await renderWebhookList(ctx);
      }

      // ─── Logs Page ─────────────────────────────────────────────────────────
      if (type === 'page_load' && interaction.page === '/logs') {
        const logsStore = ctx.storage['logs'];
        if (!logsStore) return { blocks: [{ type: 'text', text: 'Logs unreachable' }] };

        const logs = (await logsStore.query({ limit: 50 })) as { items: DeliveryLog[] };

        return {
          blocks: [
            { type: 'header', text: 'Delivery History', size: 'lg' },
            { type: 'text', text: 'Audit trail of recent webhook executions and their responses.' },
            { type: 'divider' },
            {
              type: 'table',
              columns: [
                { key: 'timestamp', label: 'Time' },
                { key: 'event', label: 'Event' },
                { key: 'url', label: 'URL' },
                { key: 'status', label: 'Status' }
              ],
              rows: logs.items.map((l) => ({
                ...l,
                status: l.status >= 200 && l.status < 300
                  ? `${l.status} OK`
                  : `${l.status} Failed`
              }))
            }
          ]
        };
      }

      // ─── Handle Webhook Creation Form ──────────────────────────────────────
      if (type === 'block_action' && interaction.blockId === 'new-webhook') {
        return {
          blocks: [
            { type: 'header', text: 'Create Webhook', size: 'md' },
            {
              type: 'form',
              id: 'webhook-form',
              submitLabel: 'Save Webhook',
              blocks: [
                { type: 'input', id: 'name', label: 'Display Name', placeholder: 'e.g. Production Webhook', required: true },
                { type: 'input', id: 'url', label: 'Endpoint URL', placeholder: 'https://api.myapp.com/webhook', required: true },
                {
                  type: 'select',
                  id: 'event',
                  label: 'Trigger Event',
                  options: [
                    { label: 'All Content Events', value: 'all' },
                    { label: 'On Save/Create Only', value: 'save' },
                    { label: 'On Delete Only', value: 'delete' }
                  ],
                  defaultValue: 'all'
                },
                { type: 'toggle', id: 'active', label: 'Enable immediately', defaultValue: true }
              ]
            }
          ]
        };
      }

      // ─── Action: EDIT ──────────────────────────────────────────────────────
      if (type === 'block_action' && interaction.blockId.startsWith('edit:')) {
        const id = interaction.blockId.split(':')[1] || '';
        const ep = (await ctx.storage['endpoints']?.get(id)) as WebhookEndpoint | undefined;

        if (!ep) return { toast: { type: 'error', message: 'Webhook not found' }, blocks: [] };

        return {
          blocks: [
            { type: 'header', text: 'Edit Webhook', size: 'md' },
            {
              type: 'form',
              id: 'webhook-form',
              submitLabel: 'Update Webhook',
              blocks: [
                { type: 'input', id: 'id', label: 'Internal ID', placeholder: 'id', defaultValue: ep.id, required: true },
                { type: 'input', id: 'name', label: 'Display Name', placeholder: 'e.g. Production Webhook', defaultValue: ep.name, required: true },
                { type: 'input', id: 'url', label: 'Endpoint URL', placeholder: 'https://api.myapp.com/webhook', defaultValue: ep.url, required: true },
                {
                  type: 'select',
                  id: 'event',
                  label: 'Trigger Event',
                  options: [
                    { label: 'All Content Events', value: 'all' },
                    { label: 'On Save/Create Only', value: 'save' },
                    { label: 'On Delete Only', value: 'delete' }
                  ],
                  defaultValue: ep.event || 'all'
                },
                { type: 'toggle', id: 'active', label: 'Webhook Active', defaultValue: ep.active ?? true }
              ]
            }
          ]
        };
      }

      // ─── Form Submission: SAVE / UPDATE ────────────────────────────────────
      if (type === 'form_submit' && interaction.formId === 'webhook-form') {
        const { id: existingId, name, url, event, active } = interaction.values as any;
        const id = existingId || `wh_${Date.now().toString(36)}`;

        const endpointsStore = ctx.storage['endpoints'];
        if (endpointsStore) {
          await endpointsStore.put(id, { id, name, url, event, active });
        }

        const listResponse = await renderWebhookList(ctx);
        return {
          ...listResponse,
          toast: { type: 'success', message: `Webhook ${existingId ? 'updated' : 'created'} successfully!` },
        };
      }

      // ─── Action: DELETE ────────────────────────────────────────────────────
      if (type === 'block_action' && interaction.blockId.startsWith('delete:')) {
        const id = interaction.blockId.split(':')[1] || '';
        await ctx.storage['endpoints']?.delete(id);
        
        const listResponse = await renderWebhookList(ctx);
        return {
          ...listResponse,
          toast: { type: 'info', message: 'Webhook deleted.' },
        };
      }

      // ─── Action: TEST ──────────────────────────────────────────────────────
      if (type === 'block_action' && interaction.blockId.startsWith('test:')) {
        const id = interaction.blockId.split(':')[1] || '';
        const ep = (await ctx.storage['endpoints']?.get(id)) as WebhookEndpoint | undefined;

        if (ep) {
          const result = await sendWebhook(ep.url, { type: 'test', timestamp: new Date().toISOString() }, ctx);
          await ctx.storage['logs']?.put(Date.now().toString(), {
            timestamp: new Date().toISOString(),
            webhookId: id,
            url: ep.url,
            event: 'test',
            status: result.status
          });

          const listResponse = await renderWebhookList(ctx);
          return {
            ...listResponse,
            toast: {
              type: result.ok ? 'success' : 'error',
              message: `Test ${result.ok ? 'sent successfully' : 'failed'} (Status: ${result.status})`
            },
          };
        }
      }

      return { blocks: [{ type: 'text', text: 'Unknown interaction' }] };
    }
  }
});

/**
 * Helper to render the primary webhook list
 */
async function renderWebhookList(ctx: PluginContext): Promise<BlockResponse> {
  const endpointsStore = ctx.storage['endpoints'];
  if (!endpointsStore) return { blocks: [{ type: 'text', text: 'Storage unreachable' }] };

  const endpoints = (await endpointsStore.query()) as { items: WebhookEndpoint[] };

  const rows = endpoints.items.map((ep) => ({
    name: ep.name,
    url: ep.url,
    event: ep.event === 'all' ? 'All Events' : ep.event,
    status: ep.active ? 'Active' : 'Inactive',
    actions: {
      type: 'button_group',
      buttons: [
        { type: 'button', id: `edit:${ep.id}`, label: 'Edit', variant: 'outline', size: 'sm' },
        { type: 'button', id: `test:${ep.id}`, label: 'Test', variant: 'secondary', size: 'sm' },
        { type: 'button', id: `delete:${ep.id}`, label: 'Delete', variant: 'destructive', size: 'sm' }
      ]
    }
  }));

  return {
    blocks: [
      { type: 'header', text: 'Configured Webhooks', size: 'lg' },
      { type: 'text', text: 'Manage outbound endpoints that receive real-time content updates.' },
      {
        type: 'button_group',
        buttons: [{ type: 'button', id: 'new-webhook', label: 'Create New Webhook', variant: 'default' }]
      },
      { type: 'divider' },
      rows.length > 0 ? {
        type: 'table',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'url', label: 'Endpoint URL' },
          { key: 'event', label: 'Trigger' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Actions' }
        ],
        rows
      } : {
        type: 'alert',
        status: 'info',
        title: 'No Webhooks Configured',
        message: 'Click the button above to add your first automation.'
      }
    ]
  };
}

/**
 * Helper to iterate and trigger webhooks
 */
async function triggerWebhooks(event: string, payload: any, ctx: PluginContext) {
  const endpointsStore = ctx.storage['endpoints'];
  if (!endpointsStore) return;

  const endpoints = (await endpointsStore.query()) as { items: WebhookEndpoint[] };
  const logsStore = ctx.storage['logs'];

  for (const ep of endpoints.items) {
    if (!ep.active) continue;
    if (ep.event !== 'all' && ep.event !== event) continue;

    try {
      const result = await sendWebhook(ep.url, { event, payload }, ctx);
      await logsStore?.put(Date.now().toString(), {
        timestamp: new Date().toISOString(),
        webhookId: ep.id,
        url: ep.url,
        event,
        status: result.status
      });
    } catch (err) {
      ctx.log.error('Failed to trigger webhook', { url: ep.url, error: err });
    }
  }
}

/**
 * Core send logic
 */
async function sendWebhook(url: string, payload: any, ctx: PluginContext) {
  if (!ctx.http) throw new Error('HTTP capability not available');

  return await ctx.http.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'FlareCMS-Webhook/1.0' },
    body: JSON.stringify(payload)
  });
}
