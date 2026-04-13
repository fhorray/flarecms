import { definePlugin, ui } from 'flarecms/plugins';
import type {
  BlockResponse,
  PluginContext
} from 'flarecms/plugins';

/**
 * {{PLUGIN_NAME_HUMAN}} Plugin Starter
 * 
 * This is a basic starter template for building FlareCMS plugins.
 */
export default definePlugin({
  id: '{{PLUGIN_ID}}',
  name: '{{PLUGIN_NAME_HUMAN}}',
  version: '1.0.0',
  description: 'Starter template for FlareCMS plugins.',

  capabilities: [
    'network:fetch',
    'read:content',
    'write:content'
  ],

  pages: [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      render: async (ctx) => renderDashboard(ctx)
    },
  ],

  /**
   * Example API Routes
   * These routes are exposed at /api/plugins/{{PLUGIN_ID}}/[route-name]
   */
  routes: {
    'hello': {
      public: true, // If true, allows access without FlareCMS admin session
      handler: async (routeCtx, ctx) => {
        const visits = (await ctx.kv.get('visit_count') as number) || 0;
        return {
          message: 'Hello from your custom Plugin API!',
          visits,
          echo: routeCtx.input
        };
      }
    }
  },

  actions: {
    'hello-form': async (interaction, ctx) => {
      if (interaction.type !== 'form_submit') return { blocks: [] };
      const { name } = interaction.values as { name: string };
      
      return ui.response({
        toast: ui.toast('success', `Hello ${name}! The plugin is working correctly.`),
        blocks: [
          ui.header(`Hello, ${name}!`, { size: 'md' }),
          ui.text('You have successfully interacted with your new plugin.'),
          ui.button('back', 'Go Back', { variant: 'outline' })
        ]
      });
    },

    'back': async (_, ctx) => {
      // Return to main dashboard view by returning empty blocks (which forces a refresh in the shell)
      // or by re-rendering the dashboard.
      return renderDashboard(ctx);
    }
  }
});

async function renderDashboard(ctx: PluginContext): Promise<BlockResponse> {
  const visits = (await ctx.kv.get('visit_count') as number) || 0;
  await ctx.kv.set('visit_count', visits + 1);

  return ui.page([
    ui.header('Welcome to {{PLUGIN_NAME_HUMAN}}', { size: 'lg' }),
    ui.text('This is a starter plugin created automatically with the creation script.'),
    ui.divider(),
    ui.grid(2, [
      ui.stat('Plugin Status', 'Active'),
      ui.stat('Total Visits', visits)
    ]),
    ui.form('hello-form', { submitLabel: 'Say Hello' }, [
      ui.input('name', 'Your Name', { placeholder: 'Enter your name...', required: true })
    ])
  ]);
}
