import { definePlugin } from 'flarecms/plugins';
import type {
  BlockInteraction,
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
    'storage:read',
    'storage:write'
  ],

  adminPages: [
    { path: '/', label: 'Dashboard', icon: 'layout-dashboard' },
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

  admin: {
    handler: async (interaction: BlockInteraction, ctx: PluginContext): Promise<BlockResponse> => {
      const { type } = interaction;

      // Handle the main dashboard view
      if (type === 'page_load' && interaction.page === '/') {
        const visits = (await ctx.kv.get('visit_count') as number) || 0;
        await ctx.kv.set('visit_count', visits + 1);

        return {
          blocks: [
            { type: 'header', text: 'Welcome to {{PLUGIN_NAME_HUMAN}}', size: 'lg' },
            { type: 'text', text: 'This is a starter plugin created automatically with the creation script.' },
            { type: 'divider' },
            {
              type: 'grid',
              columns: 2,
              blocks: [
                { type: 'stat', label: 'Plugin Status', value: 'Active' },
                { type: 'stat', label: 'Total Visits', value: visits }
              ]
            },
            {
              type: 'form',
              id: 'hello-form',
              submitLabel: 'Say Hello',
              blocks: [
                { type: 'input', id: 'name', label: 'Your Name', placeholder: 'Enter your name...', required: true }
              ]
            }
          ]
        };
      }

      // Handle form submission
      if (type === 'form_submit' && interaction.formId === 'hello-form') {
        const { name } = interaction.values as { name: string };
        return {
          toast: { type: 'success', message: `Hello ${name}! The plugin is working correctly.` },
          blocks: [
            { type: 'header', text: `Hello, ${name}!`, size: 'md' },
            { type: 'text', text: 'You have successfully interacted with your new plugin.' },
            { type: 'button', id: 'back', label: 'Go Back', variant: 'outline' }
          ]
        };
      }

      // Handle go back action
      if (type === 'block_action' && interaction.blockId === 'back') {
        // Return to main layout
        return { blocks: [] }; // The shell will re-trigger page_load if redirected or we can just return empty and handle it.
      }

      return { blocks: [{ type: 'text', text: 'Plugin Starter is ready!' }] };
    }
  }
});
