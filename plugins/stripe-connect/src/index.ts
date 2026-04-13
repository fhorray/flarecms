import { definePlugin, ui, route, action } from 'flarecms/plugins';
import type { BlockInteraction, BlockResponse, PluginContext } from 'flarecms/plugins';
import { z } from 'zod';
import type {
  StripeConfig,
  StripeBalance,
  StripeCharge,
  StripeProduct,
  StripeCustomer,
  StripeSubscription,
  StripePaymentLink,
  StripePrice,
  StripeListResponse
} from './types';

/**
 * Stripe Connect Plugin for FlareCMS
 */
export default definePlugin({
  id: 'stripe-connect',
  name: 'Stripe Connect',
  description: 'Industrial-grade Stripe integration for FlareCMS. Manage subscriptions, products, and customers with high-security encryption.',
  version: '1.1.0',

  capabilities: [
    'network:fetch',
    'network:fetch:any',
    'storage:read',
    'storage:write',
    'crypto:encrypt',
    'crypto:decrypt'
  ],
  allowedHosts: ["api.stripe.com"],

  storage: {
    // Local configuration and small cache metadata
    config: { indexes: [] },
    sync_logs: { indexes: ['timestamp'] }
  },

  adminWidgets: [
    { id: 'mrr-stats', title: 'Stripe Overview', size: 'half' }
  ],

  pages: [
    {
      path: '/settings', label: 'Settings', icon: 'settings',
      render: async (ctx) => {
        const config = await getStripeConfig(ctx);
        return renderSettingsPage(config);
      }
    },
    {
      path: '__widget__/mrr-stats', label: 'Widget',
      render: async (ctx) => await renderMrrWidget(ctx)
    },
    { path: '/', label: 'Overview', icon: 'layout-dashboard', render: async (ctx) => renderRoot(ctx, '/') },
    { path: '/subscriptions', label: 'Subscriptions', icon: 'refresh-cw', render: async (ctx) => renderRoot(ctx, '/subscriptions') },
    { path: '/products', label: 'Products', icon: 'package', render: async (ctx) => renderRoot(ctx, '/products') },
    { path: '/customers', label: 'Customers', icon: 'users', render: async (ctx) => renderRoot(ctx, '/customers') }
  ],

  routes: {
    'get-balance': route.get().handler(async (_, ctx) => {
      const config = await getStripeConfig(ctx);
      const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
      return await stripeRequest<StripeBalance>(ctx, secretKey, 'GET', '/v1/balance');
    }),
    'get-charges': route.get().handler(async (_, ctx) => {
      const config = await getStripeConfig(ctx);
      const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
      const response = await stripeRequest<StripeListResponse<StripeCharge>>(ctx, secretKey, 'GET', '/v1/charges', { limit: 10 });
      return response.data;
    }),
    'get-subscriptions': route.get().handler(async (_, ctx) => {
      return await fetchSubscriptions(ctx);
    }),
    'get-customers': route.get().handler(async (_, ctx) => {
      const config = await getStripeConfig(ctx);
      const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
      const response = await stripeRequest<StripeListResponse<StripeCustomer>>(ctx, secretKey, 'GET', '/v1/customers', { limit: 20 });
      return response.data;
    }),
    'get-products': route.get().handler(async (_, ctx) => {
      const config = await getStripeConfig(ctx);
      const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
      const response = await stripeRequest<StripeListResponse<StripeProduct>>(ctx, secretKey, 'GET', '/v1/products', { active: true });
      return response.data;
    })
  },

  actions: {
    'settings-form': action.define()
      .input(z.object({
        secretKey: z.string().optional(),
        currency: z.string().optional(),
        testMode: z.boolean().optional()
      }))
      .handler(async ({ input }, ctx) => {
        const config = await getStripeConfig(ctx);
        const newConfig: StripeConfig = {
          ...config,
          currency: input.currency ?? config.currency,
          testMode: input.testMode ?? config.testMode
        };
        if (input.secretKey && input.secretKey !== '••••••••') {
          newConfig.encryptedKey = await ctx.crypto?.encrypt(input.secretKey) || input.secretKey;
        }
        await ctx.kv.set('config', newConfig);
        return { toast: ui.toast('success', 'Settings saved.'), ...renderSettingsPage(newConfig) };
      }),

    'reset-plugin-form': async (interaction, ctx) => {
      await ctx.kv.delete('config');
      return { toast: ui.toast('success', 'Plugin has been reset.'), ...renderSettingsPage({ encryptedKey: '', currency: 'usd', testMode: true }) };
    }
  }
});

/**
 * Stripe API Requester (Secure & Typed)
 */
async function stripeRequest<T>(ctx: PluginContext, secretKey: string, method: string, path: string, params: Record<string, any> = {}): Promise<T> {
  let url = `https://api.stripe.com${path}`;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(`${key}[]`, v));
    } else {
      searchParams.append(key, value);
    }
  }

  let body: string | undefined = undefined;
  if (method === 'GET') {
    const query = searchParams.toString();
    if (query) url += `?${query}`;
  } else {
    body = searchParams.toString();
  }

  const res = await ctx.http?.fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-04-10'
    },
    body
  });

  const json = await res?.json() as any;
  if (!res?.ok) {
    console.error('Stripe Error:', json);
    throw new Error(json.error?.message || json.error || 'Stripe API Error');
  }
  return json as T;
}

async function getStripeConfig(ctx: PluginContext): Promise<StripeConfig> {
  return await ctx.kv.get('config') as StripeConfig || { encryptedKey: '', currency: 'usd', testMode: true };
}

async function renderRoot(ctx: PluginContext, activePage: string): Promise<BlockResponse> {
  const config = await getStripeConfig(ctx);
  if (!config.encryptedKey) {
    return ui.page([
      ui.header('Secure Stripe Connection', { size: 'lg' }),
      ui.text('Enter your API keys in the settings to unlock the premium dashboard.')
    ]);
  }

  return ui.page([
    ui.custom('stripe-root', { activePage, config: { currency: config.currency, testMode: config.testMode } })
  ]);
}

function renderSettingsPage(config: StripeConfig): BlockResponse {
  const blocks = [
    ui.header('Stripe Settings', { size: 'lg' }),
    ui.form('settings-form', { submitLabel: 'Save and Encrypt' }, [
      ui.input('secretKey', 'Stripe Secret Key', { placeholder: 'sk_test_...', defaultValue: config.encryptedKey ? '••••••••' : '', required: true }),
      ui.select('currency', 'Default Currency', [{ label: 'USD', value: 'usd' }, { label: 'BRL', value: 'brl' }], { defaultValue: config.currency }),
      ui.toggle('testMode', 'Test Mode', { defaultValue: config.testMode })
    ])
  ];

  if (config.encryptedKey) {
    blocks.push(
      ui.divider(),
      ui.header('Danger Zone', { size: 'md' }),
      ui.text('Permanently remove your Stripe configuration and encrypted keys.'),
      ui.form('reset-plugin-form', { submitLabel: 'Reset Plugin Data' }, [
        ui.alert('Warning', 'This action cannot be undone.', { status: 'warning' })
      ])
    );
  }

  return ui.page(blocks);
}

async function renderMrrWidget(ctx: PluginContext): Promise<BlockResponse> {
  const data = await fetchSubscriptions(ctx);
  const mrr = (data || []).reduce((acc: number, s: any) => acc + (s.items?.data?.[0]?.price?.unit_amount || 0), 0);

  return ui.page([
    ui.grid(2, [
      ui.stat('Monthly Revenue', (mrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })),
      ui.stat('Active Subs', (data || []).length)
    ])
  ]);
}

async function fetchSubscriptions(ctx: PluginContext): Promise<StripeSubscription[]> {
  const config = await getStripeConfig(ctx);
  const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
  const response = await stripeRequest<StripeListResponse<StripeSubscription>>(ctx, secretKey, 'GET', '/v1/subscriptions', { limit: 20, expand: ['data.customer'] });
  return response.data;
}
