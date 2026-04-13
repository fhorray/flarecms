import { definePlugin, ui, action } from 'flarecms/plugins';
import type { BlockResponse, PluginContext } from 'flarecms/plugins';
import { z } from 'zod';

/**
 * Webhooks & Automations Plugin
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

const webhookFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  event: z.enum(['all', 'save', 'delete']).default('all'),
  active: z.boolean().default(true)
});

export default definePlugin({
  id: 'webhooks',
  name: 'Webhooks & Aut.',
  version: '1.0.0',

  capabilities: ['network:fetch', 'network:fetch:any', 'read:content'],

  storage: {
    endpoints: { indexes: ['active'] },
    logs: { indexes: ['timestamp', 'status'] }
  },

  adminWidgets: [{ id: 'webhook-stats', title: 'Webhook Health', size: 'half' }],

  hooks: {
    'content:afterSave': async (event, ctx) => { await triggerWebhooks('save', event, ctx); },
    'content:afterDelete': async (event, ctx) => { await triggerWebhooks('delete', event, ctx); }
  },

  pages: [
    {
      path: '/',
      label: 'Overview',
      icon: 'link',
      render: async (ctx) => await renderWebhookList(ctx)
    },
    {
      path: '/logs',
      label: 'Delivery Logs',
      icon: 'history',
      render: async (ctx) => {
        const logsStore = ctx.storage['logs'];
        if (!logsStore) return ui.page([ui.text('Logs unreachable')]);

        const logs = (await logsStore.query({ limit: 50 })) as { items: DeliveryLog[] };

        return ui.page([
          ui.header('Delivery History', { size: 'lg' }),
          ui.text('Audit trail of recent webhook executions and their responses.'),
          ui.divider(),
          ui.table(
            ['Time', 'Event', 'URL', 'Status'],
            logs.items.map((l) => [
              l.timestamp, l.event, l.url,
              l.status >= 200 && l.status < 300 ? `${l.status} OK` : `${l.status} Failed`
            ])
          )
        ]);
      }
    },
    {
      path: '__widget__/webhook-stats',
      label: 'Widget',
      render: async (ctx) => {
        const logsStore = ctx.storage['logs'];
        if (!logsStore) return ui.page([ui.text('Logs unreachable')]);

        const logs = await logsStore.query({ limit: 50 }) as { items: DeliveryLog[] };
        const successCount = logs.items.filter((l) => l.status >= 200 && l.status < 300).length;
        const total = logs.items.length;
        const rate = total > 0 ? Math.round((successCount / total) * 100) : 100;

        return ui.page([
          ui.grid(2, [
            ui.stat('Success Rate (Last 50)', `${rate}%`),
            ui.stat('Total Deliveries', total)
          ])
        ]);
      }
    }
  ],

  actions: {
    'new-webhook': async (interaction, ctx) => {
      return ui.page([
        ui.header('Create Webhook', { size: 'md' }),
        ui.form('webhook-form', { submitLabel: 'Save Webhook' }, [
          ui.input('name', 'Display Name', { placeholder: 'e.g. Production Webhook', required: true }),
          ui.input('url', 'Endpoint URL', { placeholder: 'https://api.myapp.com/webhook', required: true }),
          ui.select('event', 'Trigger Event', [
            { label: 'All Content Events', value: 'all' },
            { label: 'On Save/Create Only', value: 'save' },
            { label: 'On Delete Only', value: 'delete' }
          ], { defaultValue: 'all' }),
          ui.toggle('active', 'Enable immediately', { defaultValue: true })
        ])
      ]);
    },

    'edit': async (interaction, ctx) => {
      const id = interaction.actionParams?.[0] || '';
      const ep = (await ctx.storage['endpoints']?.get(id)) as WebhookEndpoint | undefined;

      if (!ep) return ui.response({ toast: ui.toast('error', 'Webhook not found') });

      return ui.page([
        ui.header('Edit Webhook', { size: 'md' }),
        ui.form('webhook-form', { submitLabel: 'Update Webhook' }, [
          ui.input('id', 'Internal ID', { defaultValue: ep.id, required: true }),
          ui.input('name', 'Display Name', { defaultValue: ep.name, required: true }),
          ui.input('url', 'Endpoint URL', { defaultValue: ep.url, required: true }),
          ui.select('event', 'Trigger Event', [
            { label: 'All Content Events', value: 'all' },
            { label: 'On Save/Create Only', value: 'save' },
            { label: 'On Delete Only', value: 'delete' }
          ], { defaultValue: ep.event || 'all' }),
          ui.toggle('active', 'Webhook Active', { defaultValue: ep.active ?? true })
        ])
      ]);
    },

    'webhook-form': action.define()
      .input(webhookFormSchema)
      .handler(async ({ input }, ctx) => {
        const id = input.id || `wh_${Date.now().toString(36)}`;

        const endpointsStore = ctx.storage['endpoints'];
        if (endpointsStore) {
          await endpointsStore.put(id, { id, ...input });
        }

        return ui.redirect('/', {
          toast: ui.toast('success', `Webhook ${input.id ? 'updated' : 'created'} successfully!`)
        });
      }),

    'delete': async (interaction, ctx) => {
      const id = interaction.actionParams?.[0] || '';
      return ui.response({
        dialog: ui.alertDialog('Delete Webhook', {
          description: 'Are you sure you want to delete this webhook?',
          confirmText: 'Delete',
          onConfirm: `confirm-delete:${id}`
        })
      });
    },

    'confirm-delete': async (interaction, ctx) => {
      const id = interaction.actionParams?.[0] || '';
      await ctx.storage['endpoints']?.delete(id);
      return ui.redirect('/', { toast: ui.toast('info', 'Webhook deleted.') });
    },

    'test': async (interaction, ctx) => {
      const id = interaction.actionParams?.[0] || '';
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

        return ui.redirect('/', {
          toast: ui.toast(result.ok ? 'success' : 'error', `Test ${result.ok ? 'sent successfully' : 'failed'} (Status: ${result.status})`)
        });
      }
      return ui.response({ toast: ui.toast('error', 'Webhook not found.') });
    }
  }
});

async function renderWebhookList(ctx: PluginContext): Promise<BlockResponse> {
  const endpointsStore = ctx.storage['endpoints'];
  if (!endpointsStore) return ui.page([ui.text('Storage unreachable')]);

  const endpoints = (await endpointsStore.query()) as { items: WebhookEndpoint[] };

  const rows = endpoints.items.map((ep) => [
    ep.name,
    ep.url,
    ep.event === 'all' ? 'All Events' : ep.event,
    ep.active ? 'Active' : 'Inactive',
    ui.buttonGroup([
      ui.button(`edit:${ep.id}`, 'Edit', { variant: 'outline', size: 'sm' }),
      ui.button(`test:${ep.id}`, 'Test', { variant: 'secondary', size: 'sm' }),
      ui.button(`delete:${ep.id}`, 'Delete', { variant: 'destructive', size: 'sm' })
    ])
  ]);

  return ui.page([
    ui.header('Configured Webhooks', { size: 'lg' }),
    ui.text('Manage outbound endpoints that receive real-time content updates.'),
    ui.buttonGroup([ui.button('new-webhook', 'Create New Webhook', { variant: 'default' })]),
    ui.divider(),
    rows.length > 0
      ? ui.table(['Name', 'Endpoint URL', 'Trigger', 'Status', 'Actions'], rows)
      : ui.alert('No Webhooks Configured', 'Click the button above to add your first automation.', { status: 'info' })
  ]);
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
