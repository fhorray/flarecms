import { definePlugin } from 'flarecms/plugins';
import type {
  BlockInteraction,
  BlockResponse,
  PluginContext,
} from 'flarecms/plugins';
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

  adminPages: [
    { path: '/', label: 'Overview', icon: 'layout-dashboard' },
    { path: '/subscriptions', label: 'Subscriptions', icon: 'refresh-cw' },
    { path: '/products', label: 'Products', icon: 'package' },
    { path: '/customers', label: 'Customers', icon: 'users' },
    { path: '/settings', label: 'Settings', icon: 'settings' }
  ],

  adminWidgets: [
    { id: 'mrr-stats', title: 'Stripe Overview', size: 'half' }
  ],

  routes: {
    'get-balance': {
      handler: async (_, ctx) => {
        const config = await getStripeConfig(ctx);
        const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
        return await stripeRequest<StripeBalance>(ctx, secretKey, 'GET', '/v1/balance');
      }
    },
    'get-charges': {
      handler: async (_, ctx) => {
        const config = await getStripeConfig(ctx);
        const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
        const response = await stripeRequest<StripeListResponse<StripeCharge>>(ctx, secretKey, 'GET', '/v1/charges', { limit: 10 });
        return response.data;
      }
    },
    'get-subscriptions': {
      handler: async (_, ctx) => {
        return await fetchSubscriptions(ctx);
      }
    },
    'get-customers': {
      handler: async (_, ctx) => {
        const config = await getStripeConfig(ctx);
        const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
        const response = await stripeRequest<StripeListResponse<StripeCustomer>>(ctx, secretKey, 'GET', '/v1/customers', { limit: 20 });
        return response.data;
      }
    },
    'get-products': {
      handler: async (_, ctx) => {
        const config = await getStripeConfig(ctx);
        const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
        const response = await stripeRequest<StripeListResponse<StripeProduct>>(ctx, secretKey, 'GET', '/v1/products', { active: true });
        return response.data;
      }
    }
  },

  admin: {
    handler: async (interaction: BlockInteraction, ctx: PluginContext): Promise<BlockResponse> => {
      const { type } = interaction;
      const config = await getStripeConfig(ctx);

      // Handle Settings & Reset (Server-side for safety/KV access)
      if (interaction.type === 'page_load' && interaction.page === '/settings') {
        return renderSettingsPage(config);
      }

      // Handle Dashboard Widget
      if (interaction.type === 'page_load' && interaction.page === '__widget__/mrr-stats') {
        return await renderMrrWidget(ctx);
      }

      if (type === 'form_submit') {
        if (interaction.formId === 'settings-form') {
          const vals = interaction.values as any;
          const newConfig: StripeConfig = {
            ...config,
            currency: vals.currency ?? config.currency,
            testMode: vals.testMode ?? config.testMode
          };
          if (vals.secretKey && vals.secretKey !== '••••••••') {
            newConfig.encryptedKey = await ctx.crypto?.encrypt(vals.secretKey) || vals.secretKey;
          }
          await ctx.kv.set('config', newConfig);
          return { toast: { type: 'success', message: 'Settings saved.' }, ...renderSettingsPage(newConfig) };
        }
        if (interaction.formId === 'reset-plugin-form') {
          await ctx.kv.delete('config');
          return { toast: { type: 'success', message: 'Plugin has been reset.' }, ...renderSettingsPage({ encryptedKey: '', currency: 'usd', testMode: true }) };
        }
      }

      // Everything else served by the Root Component (SPA-mode)
      if (!config.encryptedKey) return renderWelcome();

      return {
        blocks: [
          {
            type: 'custom',
            component: 'stripe-root',
            props: {
              activePage: interaction.type === 'page_load' ? interaction.page : '/',
              config: { currency: config.currency, testMode: config.testMode }
            }
          }
        ]
      };
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

function renderWelcome(): BlockResponse {
  return {
    blocks: [
      { type: 'header', text: 'Secure Stripe Connection', size: 'lg' },
      { type: 'text', text: 'Enter your API keys in the settings to unlock the premium dashboard.' }
    ]
  };
}

function renderSettingsPage(config: StripeConfig): BlockResponse {
  const resetFormBlock = config.encryptedKey ? [
    { type: 'divider' },
    { type: 'header', text: 'Danger Zone', size: 'md' },
    { type: 'text', text: 'Permanently remove your Stripe configuration and encrypted keys.' },
    {
      type: 'form',
      id: 'reset-plugin-form',
      submitLabel: 'Reset Plugin Data',
      blocks: [
        { type: 'alert', status: 'warning', message: 'This action cannot be undone.' }
      ]
    }
  ] : [];

  return {
    blocks: [
      { type: 'header', text: 'Stripe Settings', size: 'lg' },
      {
        type: 'form',
        id: 'settings-form',
        submitLabel: 'Save and Encrypt',
        blocks: [
          { type: 'input', id: 'secretKey', label: 'Stripe Secret Key', placeholder: 'sk_test_...', defaultValue: config.encryptedKey ? '••••••••' : '', required: true },
          { type: 'select', id: 'currency', label: 'Default Currency', options: [{ label: 'USD', value: 'usd' }, { label: 'BRL', value: 'brl' }], defaultValue: config.currency },
          { type: 'toggle', id: 'testMode', label: 'Test Mode', defaultValue: config.testMode }
        ]
      },
      ...resetFormBlock
    ] as any[]
  };
}

async function renderMrrWidget(ctx: PluginContext): Promise<BlockResponse> {
  // Logic to fetch MRR quickly for the dashboard
  const data = await fetchSubscriptions(ctx);
  const mrr = (data || []).reduce((acc: number, s: any) => acc + (s.items?.data?.[0]?.price?.unit_amount || 0), 0);
  
  return {
    blocks: [
      {
        type: 'grid',
        columns: 2,
        blocks: [
          { type: 'stat', label: 'Monthly Revenue', value: (mrr / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) },
          { type: 'stat', label: 'Active Subs', value: (data || []).length }
        ]
      }
    ]
  };
}

async function fetchSubscriptions(ctx: PluginContext): Promise<StripeSubscription[]> {
  const config = await getStripeConfig(ctx);
  const secretKey = await ctx.crypto?.decrypt(config.encryptedKey) || '';
  const response = await stripeRequest<StripeListResponse<StripeSubscription>>(ctx, secretKey, 'GET', '/v1/subscriptions', { limit: 20, expand: ['data.customer'] });
  return response.data;
}
