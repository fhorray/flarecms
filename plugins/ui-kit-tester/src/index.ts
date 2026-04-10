import { definePlugin } from 'flarecms/plugins';
import type {
  BlockInteraction,
  BlockResponse,
  PluginContext,
} from 'flarecms/plugins';

/**
 * UI Kit Tester Plugin
 *
 * A developer-focused plugin that exercises every Block Kit component
 * and interaction type available in FlareCMS. Use this to verify that
 * the entire Plugin Admin UI system is working end-to-end.
 */
export default definePlugin({
  id: 'ui-kit-tester',
  name: 'UI Kit Tester',
  version: '1.0.0',
  adminPages: [
    { path: '/', label: 'Overview' },
    { path: '/blocks', label: 'Blocks' },
    { path: '/forms', label: 'Forms' },
    { path: '/data', label: 'Data' }
  ],
  adminWidgets: [
    { id: 'summary', title: 'System Overview', size: 'full' }
  ],
  capabilities: [
    'read:content',
    'write:content',
    'network:fetch',
    'network:fetch:any'
  ],
  hooks: {
    // Trocado de 'content:created' para o hook padrão suportado pela arquitetura
    'content:afterSave': async (event, ctx) => {
      ctx.log.info('ui-kit-tester: content:afterSave hook fired', event);
    },
  },

  admin: {
    handler: async (
      interaction: BlockInteraction,
      ctx: PluginContext,
    ): Promise<BlockResponse> => {
      ctx.log.info(`[ui-kit-tester] interaction`, interaction);

      // ─── Widget ────────────────────────────────────────────────────────────
      if (
        interaction.type === 'page_load' &&
        interaction.page.startsWith('__widget__/')
      ) {
        const widgetId = interaction.page.replace('__widget__/', '');

        if (widgetId === 'summary') {
          let kvHits = 0;
          try {
            const val = await ctx.kv.get('test:counter');
            kvHits = typeof val === 'number' ? val : 0;
          } catch {
            // KV may not be configured in playground, log silently
          }

          return {
            blocks: [
              {
                type: 'grid',
                columns: 3,
                blocks: [
                  {
                    type: 'stat',
                    label: 'Plugin Version',
                    value: '1.0.0',
                  },
                  {
                    type: 'stat',
                    label: 'Hook',
                    value: 'content:afterSave',
                    change: 0,
                  },
                  {
                    type: 'stat',
                    label: 'KV Interactions',
                    value: kvHits,
                    change: kvHits > 0 ? 5 : 0,
                  },
                ],
              },
            ],
          };
        }

        return { blocks: [{ type: 'text', text: `Unknown widget: ${widgetId}` }] };
      }

      // ─── Overview Page ─────────────────────────────────────────────────────
      if (
        interaction.type === 'page_load' &&
        (interaction.page === '/' || interaction.page === '')
      ) {
        return {
          blocks: [
            { type: 'header', text: 'UI Kit Tester', size: 'xl' },
            {
              type: 'text',
              text: 'This plugin surfaces every Block Kit component. Navigate the pages to test individual block categories.',
            },
            { type: 'divider' },
            {
              type: 'grid',
              columns: 3,
              blocks: [
                { type: 'stat', label: 'Block Types', value: 14 },
                { type: 'stat', label: 'Interaction Types', value: 3 },
                { type: 'stat', label: 'Admin Pages', value: 4, change: 100 },
              ],
            },
            { type: 'divider' },
            {
              type: 'alert',
              status: 'info',
              title: 'Getting Started',
              message:
                'Use the sidebar to navigate to Blocks, Forms, or Data pages to see each UI component in action.',
            },
            {
              type: 'card',
              title: 'React Extension Test',
              description: 'This block is a "real" React component rendered via the block registry.',
              blocks: [
                {
                  type: 'custom',
                  component: 'tester-component',
                  props: { initialCount: 42, label: 'Dynamic Counter' }
                }
              ]
            },
            {
              type: 'card',
              title: 'Plugin Context',
              description: 'Data exposed by the PluginContext at runtime.',
              blocks: [
                { type: 'text', text: `Plugin ID: ${ctx.plugin.id}` },
                { type: 'text', text: `Plugin Version: ${ctx.plugin.version}` },
                { type: 'text', text: `Site: ${ctx.site.name} (${ctx.site.url})` },
                { type: 'text', text: `Locale: ${ctx.site.locale}` },
              ],
            },
          ],
        };
      }

      // ─── Blocks Demo Page ──────────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/blocks') {
        return {
          blocks: [
            { type: 'header', text: 'Display Blocks', size: 'lg' },
            {
              type: 'text',
              text: 'All read-only display blocks: headers, text, dividers, alerts, stats, badges.',
            },
            { type: 'divider' },

            { type: 'header', text: 'Header XL', size: 'xl' },
            { type: 'header', text: 'Header LG', size: 'lg' },
            { type: 'header', text: 'Header MD', size: 'md' },
            { type: 'header', text: 'Header SM', size: 'sm' },

            { type: 'divider' },

            {
              type: 'text',
              text: 'This is a regular text block. It can contain longer paragraphs of descriptive content.',
            },

            { type: 'divider' },

            {
              type: 'grid',
              columns: 2,
              blocks: [
                {
                  type: 'alert',
                  status: 'info',
                  title: 'Info Alert',
                  message: 'This is an informational alert block.',
                },
                {
                  type: 'alert',
                  status: 'success',
                  title: 'Success Alert',
                  message: 'The operation was completed successfully.',
                },
                {
                  type: 'alert',
                  status: 'warning',
                  title: 'Warning Alert',
                  message: 'Proceed with caution.',
                },
                {
                  type: 'alert',
                  status: 'destructive',
                  title: 'Error Alert',
                  message: 'Something went wrong.',
                },
              ],
            },

            { type: 'divider' },

            {
              type: 'grid',
              columns: 4,
              blocks: [
                { type: 'stat', label: 'Total Users', value: 1024, change: 12 },
                { type: 'stat', label: 'Active Sessions', value: 47 },
                { type: 'stat', label: 'Uptime', value: '99.9%' },
                { type: 'stat', label: 'Error Rate', value: '0.01%', change: -50 },
              ],
            },
          ],
        };
      }

      // ─── Forms Demo Page ───────────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/forms') {
        return {
          blocks: [
            { type: 'header', text: 'Input Blocks & Forms', size: 'lg' },
            {
              type: 'text',
              text: 'All interactive input blocks and how they compose into a form with submission handling.',
            },
            { type: 'divider' },

            {
              type: 'form',
              id: 'demo-form',
              submitLabel: 'Submit Demo Form',
              blocks: [
                {
                  type: 'input',
                  id: 'name',
                  label: 'Full Name',
                  placeholder: 'Enter your full name',
                  required: true,
                },
                {
                  type: 'input',
                  id: 'email',
                  label: 'Email Address',
                  placeholder: 'user@example.com',
                },
                {
                  type: 'textarea',
                  id: 'bio',
                  label: 'Bio',
                  placeholder: 'Tell us about yourself...',
                  rows: 4,
                },
                {
                  type: 'select',
                  id: 'role',
                  label: 'Role',
                  options: [
                    { label: 'Developer', value: 'developer' },
                    { label: 'Designer', value: 'designer' },
                    { label: 'Product Manager', value: 'pm' },
                  ],
                },
                {
                  type: 'toggle',
                  id: 'notifications',
                  label: 'Enable Notifications',
                  defaultValue: true,
                },
              ],
            },

            { type: 'divider' },
            { type: 'header', text: 'Individual Buttons', size: 'md' },
            {
              type: 'button_group',
              buttons: [
                {
                  type: 'button',
                  id: 'btn-primary',
                  label: 'Primary Action',
                  variant: 'default',
                },
                {
                  type: 'button',
                  id: 'btn-outline',
                  label: 'Secondary',
                  variant: 'outline',
                },
                {
                  type: 'button',
                  id: 'btn-destructive',
                  label: 'Destructive',
                  variant: 'destructive',
                },
              ],
            },
          ],
        };
      }

      // ─── Data Table Demo Page ──────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/data') {
        return {
          blocks: [
            { type: 'header', text: 'Data Blocks', size: 'lg' },
            {
              type: 'text',
              text: 'Tables and structured data display powered by Block Kit.',
            },
            { type: 'divider' },

            {
              type: 'table',
              columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'role', label: 'Role' },
                { key: 'status', label: 'Status' },
                { key: 'joined', label: 'Last Active' },
              ],
              rows: [
                { id: 1, name: 'Alice Martin', role: 'Admin', status: 'Active', joined: '2024-01-15' },
                { id: 2, name: 'Bob Chen', role: 'Developer', status: 'Active', joined: '2024-02-03' },
                { id: 3, name: 'Clara Nunes', role: 'Designer', status: 'Inactive', joined: '2024-03-20' },
                { id: 4, name: 'David Kim', role: 'PM', status: 'Active', joined: '2024-04-01' },
                { id: 5, name: 'Eva Rossi', role: 'Developer', status: 'Pending', joined: '2024-04-08' },
              ],
            },

            { type: 'divider' },

            {
              type: 'card',
              title: 'KV Store Tester',
              description: 'Test reading and writing to the Plugin KV store.',
              blocks: [
                {
                  type: 'button_group',
                  buttons: [
                    {
                      type: 'button',
                      id: 'kv-increment',
                      label: 'Increment Counter in KV',
                      variant: 'default',
                    },
                    {
                      type: 'button',
                      id: 'kv-reset',
                      label: 'Reset Counter',
                      variant: 'outline',
                    },
                  ],
                },
              ],
            },
          ],
        };
      }

      // ─── Handle Button Actions ─────────────────────────────────────────────
      if (interaction.type === 'block_action') {
        if (interaction.blockId === 'kv-increment') {
          let counter = 0;
          try {
            const current = await ctx.kv.get('test:counter');
            counter = (typeof current === 'number' ? current : 0) + 1;
            await ctx.kv.set('test:counter', counter);
          } catch {
            // ignore KV errors in dev environments
          }

          return {
            blocks: [
              {
                type: 'alert',
                status: 'success',
                title: 'KV Counter Incremented',
                message: `Current value: ${counter}`,
              },
            ],
            toast: { type: 'success', message: `Counter is now ${counter}` },
          };
        }

        if (interaction.blockId === 'kv-reset') {
          try {
            await ctx.kv.set('test:counter', 0);
          } catch {
            // ignore
          }
          return {
            blocks: [
              {
                type: 'alert',
                status: 'info',
                title: 'KV Counter Reset',
                message: 'The counter has been set back to 0.',
              },
            ],
            toast: { type: 'info', message: 'Counter reset to 0' },
          };
        }

        // Generic button feedback
        return {
          blocks: [
            {
              type: 'alert',
              status: 'success',
              title: 'Block Action Received',
              message: `blockId: "${interaction.blockId}", value: ${JSON.stringify(interaction.value ?? null)}`,
            },
          ],
          toast: { type: 'success', message: `Action "${interaction.blockId}" processed` },
        };
      }

      // ─── Handle Form Submission ────────────────────────────────────────────
      if (interaction.type === 'form_submit') {
        const entries = Object.entries(interaction.values)
          .map(([k, v]) => ({ key: k, value: String(v ?? '') }));

        return {
          blocks: [
            {
              type: 'alert',
              status: 'success',
              title: 'Form Submitted Successfully',
              message: `Received ${entries.length} field(s) from form "${interaction.formId}".`,
            },
            {
              type: 'table',
              columns: [
                { key: 'key', label: 'Field' },
                { key: 'value', label: 'Value' },
              ],
              rows: entries,
            },
          ],
          toast: { type: 'success', message: 'Form data received by backend!' },
        };
      }

      // ─── Fallback ──────────────────────────────────────────────────────────
      return {
        blocks: [
          {
            type: 'alert',
            status: 'warning',
            title: 'Unhandled Interaction',
            message: `Interaction type "${interaction.type}" was not handled.`,
          },
        ],
      };
    },
  },
});