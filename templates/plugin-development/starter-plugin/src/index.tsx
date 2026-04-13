/** @jsxImportSource flarecms */
import { definePlugin, definePage } from 'flarecms/plugins';
import { 
  Page, 
  Header, 
  Text, 
  Divider, 
  Stat, 
  Grid, 
  Form, 
  Input, 
  Button, 
  ButtonGroup,
  Card,
  Alert
} from 'flarecms/ui';

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
  ],

  adminPages: [
    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
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
    handler: definePage(async (interaction, ctx) => {
      const { type } = interaction;

      // ─── Handle dashboard view ─────────────────────────────────────────────
      if (type === 'page_load' && (interaction.page === '/' || interaction.page === '')) {
        const visits = (await ctx.kv.get('visit_count') as number) || 0;
        await ctx.kv.set('visit_count', visits + 1);

        return (
          <Page>
            <Header size="lg">Welcome to {{PLUGIN_NAME_HUMAN}}</Header>
            <Text>This is a starter plugin created automatically with the creation script.</Text>
            <Divider />
            <Grid columns={2}>
              <Stat label="Plugin Status" value="Active" />
              <Stat label="Total Visits" value={visits} />
            </Grid>
            <Card title="Quick Action">
              <Form action="hello-form" submitLabel="Say Hello">
                <Input id="name" label="Your Name" placeholder="Enter your name..." required />
              </Form>
            </Card>
          </Page>
        );
      }

      // ─── Handle form submission ────────────────────────────────────────────
      if (type === 'form_submit' && interaction.formId === 'hello-form') {
        const { name } = interaction.values as { name: string };
        
        return (
          <Page>
            <Alert status="success" title={`Hello, ${name}!`}>
              You have successfully interacted with your new plugin.
            </Alert>
            <ButtonGroup>
              <Button id="back" variant="outline">Go Back</Button>
            </ButtonGroup>
          </Page>
        );
      }

      // ─── Handle block actions ──────────────────────────────────────────────
      if (type === 'block_action' && interaction.blockId === 'back') {
        // Redirection or re-render handled by returning to state
        return { toast: { type: 'info', message: 'Returning to dashboard...' } };
      }

      return (
        <Page>
          <Text>Plugin Starter is ready!</Text>
        </Page>
      );
    })
  }
});
