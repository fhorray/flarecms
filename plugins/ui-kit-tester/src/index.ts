import { definePlugin, defineFeature, ui } from 'flarecms/plugins';
import type {
  BlockResponse,
  PluginContext,
} from 'flarecms/plugins';

/**
 * Overlay Feature
 * Groups all interactive overlays and their associated actions.
 */
const OverlayFeature = defineFeature({
  id: 'overlays',
  label: 'Interactions',
  icon: 'square-slash',
  page: {
    path: '/overlays',
    render: async () => renderOverlays()
  },
  actions: {
    'trigger-dialog': async () => {
      return ui.response({
        dialog: ui.dialog('Config Settings', [
          ui.text('You are opening a standard dialog. This modal can contain any Block Kit components.'),
          ui.form('dialog-settings', { submitLabel: 'Save Preferences' }, [
            ui.select('theme', 'User Theme', [
              { label: 'System Default', value: 'system' },
              { label: 'Dark Mode', value: 'dark' },
              { label: 'Light Mode', value: 'light' },
            ]),
            ui.toggle('analytics', 'Enable Usage Analytics', { defaultValue: true }),
          ]),
          ui.divider(),
          ui.text('Note: Closing this dialog will not trigger any action unless you use the form submit button.', { variant: 'muted' })
        ], { confirmText: 'Apply Changes', onConfirm: 'confirm-overlay', size: 'lg' })
      });
    },
    'trigger-alert': async () => {
      return ui.response({
        dialog: ui.alertDialog('Critical Action Required', {
          description: 'Are you absolutely sure you want to proceed? this action will permanently delete items from your temporary store.',
          confirmText: 'Yes, Proceed',
          cancelText: 'Maybe Later',
          onConfirm: 'confirm-overlay'
        })
      });
    },
    'trigger-sheet': async () => {
      return ui.response({
        dialog: ui.sheet('Advanced Properties', [
          ui.header('Internal Metadata', { size: 'sm' }),
          ui.table(['Attribute', 'Value'], [
            ['ID', 'UID-88291'],
            ['Status', 'PROCESSED'],
            ['Worker', 'US-EAST-1'],
            ['Latency', '14ms']
          ]),
          ui.divider(),
          ui.header('Configuration', { size: 'sm' }),
          ui.input('raw-json', 'Raw JSON Object', { placeholder: '{}' }),
          ui.button('apply-raw', 'Format JSON', { variant: 'outline' }),
        ], { confirmText: 'Update Properties', onConfirm: 'confirm-overlay', size: 'xl', cancelText: 'Cancel' })
      });
    },
    'confirm-overlay': async () => {
      return ui.response({
        toast: ui.toast('success', 'Overlay action confirmed and processed!'),
        blocks: [
          ui.alert('Action Confirmed', 'The interaction from the overlay was successfully captured on the backend.', { status: 'success' })
        ]
      });
    },
    'toast-success': async () => ui.response({ toast: ui.toast('success', 'Operation completed successfully!') }),
    'toast-error': async () => ui.response({ toast: ui.toast('error', 'A system error occurred during processing.') }),
    'toast-info': async () => ui.response({ toast: ui.toast('info', 'New update available for this plugin.') }),
    'toast-warning': async () => ui.response({ toast: ui.toast('warning', 'Low storage remaining on this node.') }),
  }
});

/**
 * UI Kit Tester Plugin
 */
export default definePlugin({
  id: 'ui-kit-tester',
  name: 'UI Kit Tester',
  version: '1.0.0',
  format: "standard",
  // Standard pages
  pages: [
    {
      path: '/', label: 'Overview', icon: 'layout-dashboard',
      render: async (ctx) => renderOverview(ctx)
    },
    {
      path: '/blocks', label: 'Blocks', icon: 'layers',
      render: async () => renderBlocks()
    },
    {
      path: '/forms', label: 'Forms', icon: 'message-square',
      render: async () => renderForms()
    },
    {
      path: '/data', label: 'Data', icon: 'database',
      render: async (ctx) => renderData(ctx)
    },
    {
      path: '__widget__/summary', label: 'Summary Widget',
      render: async (ctx) => renderSummaryWidget(ctx)
    }
  ],

  // New modular features
  features: [
    OverlayFeature
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
    'content:afterSave': async (event, ctx) => {
      ctx.log.info('ui-kit-tester: content:afterSave hook fired', event);
      try {
        const current = await ctx.kv.get('stats:after_save_count');
        const count = (typeof current === 'number' ? current : 0) + 1;
        await ctx.kv.set('stats:after_save_count', count);
      } catch (e) {
        ctx.log.error('Failed to update stats in KV', e);
      }
    },
  },

  actions: {
    'demo-form': async (interaction, ctx) => {
      if (interaction.type !== 'form_submit') return { blocks: [] };
      const entries = Object.entries(interaction.values)
        .map(([k, v]) => [k, String(v ?? '')]);

      return {
        blocks: [
          ui.alert('Form Submitted Successfully', `Received ${entries.length} field(s) from form "${interaction.formId}".`, { status: 'success' }),
          ui.table(['Field', 'Value'], entries),
        ],
        toast: ui.toast('success', 'Form data received by backend!'),
      };
    },
    'kv-increment': async (_, ctx) => {
      let counter = 0;
      try {
        const current = await ctx.kv.get('test:counter');
        counter = (typeof current === 'number' ? current : 0) + 1;
        await ctx.kv.set('test:counter', counter);
      } catch { /* ignore */ }

      return ui.response({
        blocks: [
          ui.alert('KV Counter Incremented', `Current value: ${counter}`, { status: 'success' }),
        ],
        toast: ui.toast('success', `Counter is now ${counter}`),
      });
    },
    'kv-reset': async (_, ctx) => {
      try {
        await ctx.kv.set('test:counter', 0);
      } catch { /* ignore */ }
      return ui.response({
        blocks: [
          ui.alert('KV Counter Reset', 'The counter has been set back to 0.', { status: 'info' }),
        ],
        toast: ui.toast('info', 'Counter reset to 0'),
      });
    },
  }
});

// ── Rendering Functions ──────────────────────────────────────────────────

async function renderOverview(ctx: PluginContext): Promise<BlockResponse> {
  return ui.page([
    ui.header('UI Kit Tester', { size: 'xl' }),
    ui.text('This plugin surfaces every Block Kit component. Navigate the pages to test individual block categories.'),
    ui.divider(),
    ui.grid(3, [
      ui.stat('Block Types', 14),
      ui.stat('Interaction Types', 3),
      ui.stat('Admin Pages', 5, { change: 25 } as any),
    ]),
    ui.divider(),
    ui.alert('Getting Started', 'Use the sidebar to navigate through individual block categories, forms, and the new interactive overlays.', { status: 'info' }),
    ui.card([
      ui.custom('tester-component', { initialCount: 42, label: 'Dynamic Counter' })
    ], { id: 'tester-card' }),
    ui.card([
      ui.text(`Plugin ID: ${ctx.plugin.id}`),
      ui.text(`Plugin Version: ${ctx.plugin.version}`),
      ui.text(`Site: ${ctx.site.name} (${ctx.site.url})`),
      ui.text(`Locale: ${ctx.site.locale}`),
    ], { id: 'context-card' }),
  ]);
}

function renderBlocks(): BlockResponse {
  return ui.page([
    ui.header('Display Blocks', { size: 'lg' }),
    ui.text('All read-only display blocks: headers, text, dividers, alerts, stats, badges.'),
    ui.divider(),
    ui.header('Header XL', { size: 'xl' }),
    ui.header('Header LG', { size: 'lg' }),
    ui.header('Header MD', { size: 'md' }),
    ui.header('Header SM', { size: 'sm' }),
    ui.divider(),
    ui.text('This is a regular text block. It can contain longer paragraphs of descriptive content.'),
    ui.divider(),
    ui.grid(2, [
      ui.alert('Info Alert', 'This is an informational alert block.', { status: 'info' }),
      ui.alert('Success Alert', 'The operation was completed successfully.', { status: 'success' }),
      ui.alert('Warning Alert', 'Proceed with caution.', { status: 'warning' }),
      ui.alert('Error Alert', 'Something went wrong.', { status: 'error' }),
    ]),
    ui.divider(),
    ui.grid(4, [
      ui.stat('Total Users', 1024),
      ui.stat('Active Sessions', 47),
      ui.stat('Uptime', '99.9%'),
      ui.stat('Error Rate', '0.01%'),
    ]),
  ]);
}

function renderForms(): BlockResponse {
  return ui.page([
    ui.header('Input Blocks & Forms', { size: 'lg' }),
    ui.text('All interactive input blocks and how they compose into a form with submission handling.'),
    ui.divider(),
    ui.form('demo-form', { submitLabel: 'Submit Demo Form' }, [
      ui.input('name', 'Full Name', { placeholder: 'Enter your full name', required: true }),
      ui.input('email', 'Email Address', { placeholder: 'user@example.com' }),
      ui.textarea('bio', 'Bio', { placeholder: 'Tell us about yourself...', rows: 4 }),
      ui.select('role', 'Role', [
        { label: 'Developer', value: 'developer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Product Manager', value: 'pm' },
      ]),
      ui.toggle('notifications', 'Enable Notifications', { defaultValue: true }),
    ]),
    ui.divider(),
    ui.header('Individual Buttons', { size: 'md' }),
    ui.buttonGroup([
      ui.button('btn-primary', 'Primary Action', { variant: 'default' }),
      ui.button('btn-outline', 'Secondary', { variant: 'outline' }),
      ui.button('btn-destructive', 'Destructive', { variant: 'destructive' }),
    ]),
  ]);
}

async function renderData(ctx: PluginContext): Promise<BlockResponse> {
  return ui.page([
    ui.header('Data Blocks', { size: 'lg' }),
    ui.text('Tables and structured data display powered by Block Kit.'),
    ui.divider(),
    ui.table(['ID', 'Name', 'Role', 'Status', 'Last Active'], [
      [1, 'Alice Martin', 'Admin', 'Active', '2024-01-15'],
      [2, 'Bob Chen', 'Developer', 'Active', '2024-02-03'],
      [3, 'Clara Nunes', 'Designer', 'Inactive', '2024-03-20'],
      [4, 'David Kim', 'PM', 'Active', '2024-04-01'],
      [5, 'Eva Rossi', 'Developer', 'Pending', '2024-04-08'],
    ]),
    ui.divider(),
    ui.card([
      ui.buttonGroup([
        ui.button('kv-increment', 'Increment Counter in KV'),
        ui.button('kv-reset', 'Reset Counter', { variant: 'outline' }),
      ]),
    ], { id: 'kv-card' } as any),
  ]);
}

function renderOverlays(): BlockResponse {
  return ui.page([
    ui.header('Interactions & Overlays', { size: 'lg' }),
    ui.text('Test system overlays (Dialogs, Sheets) and transient notifications (Toasts) triggered from the backend.'),
    ui.divider(),
    ui.grid(2, [
      ui.card([
        ui.header('Modals & Panels', { size: 'md' }),
        ui.text('Trigger complex interactive overlays that can contain other blocks.'),
        ui.button('trigger-dialog', 'Open Dialog'),
        ui.button('trigger-alert', 'Open Alert Dialog', { variant: 'destructive' }),
        ui.button('trigger-sheet', 'Open Side Sheet', { variant: 'secondary' }),
      ]),

      ui.card([
        ui.header('Transient Toasts', { size: 'md' }),
        ui.text('Trigger small transient notifications to inform the user of action results.'),
        ui.buttonGroup([
          ui.button('toast-success', 'Success'),
          ui.button('toast-error', 'Error', { variant: 'destructive' }),
          ui.button('toast-info', 'Info', { variant: 'secondary' }),
          ui.button('toast-warning', 'Warning', { variant: 'outline' }),
        ]),
      ]),
    ]),
  ]);
}

async function renderSummaryWidget(ctx: PluginContext): Promise<BlockResponse> {
  let kvHits = 0;
  let hookCount = 0;
  try {
    const val = await ctx.kv.get('test:counter');
    kvHits = typeof val === 'number' ? val : 0;
    const hVal = await ctx.kv.get('stats:after_save_count');
    hookCount = typeof hVal === 'number' ? hVal : 0;
  } catch { /* ignore */ }

  return ui.page([
    ui.grid(3, [
      ui.stat('Plugin Version', '1.0.0'),
      ui.stat('Content Saves', hookCount),
      ui.stat('KV Interactions', kvHits),
    ]),
  ]);
}
