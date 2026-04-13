/** @jsxImportSource flarecms */
import { definePlugin, definePage } from 'flarecms/plugins';
import {
  Page,
  Header,
  Text,
  Divider,
  Stat,
  Alert,
  Card,
  Grid,
  Table,
  Button,
  ButtonGroup,
  Form,
  Input,
  Textarea,
  Select,
  Toggle,
  Checkbox,
  Slider,
  InputOTP,
  Combobox,
  Calendar,
  Carousel,
  Tabs,
  Accordion,
  Avatar,
  Badge,
  Breadcrumb,
  Pagination,
  Progress,
  ScrollArea,
  Sheet,
  Dialog,
  Spinner,
  Item,
  Custom,
  AutoForm,
  Label
} from 'flarecms/ui';
import { z } from 'zod';

const settingsSchema = z.object({
  siteName: z.string().describe('The name of your site'),
  enableCache: z.boolean().default(true),
  maxUploadSize: z.number().default(50),
  environment: z.enum(['development', 'production', 'staging']).default('development'),
  role: z.enum(['admin', 'editor', 'viewer']).default('admin'),
});

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
    { path: '/', label: 'Overview', icon: 'LayoutDashboard' },
    { path: '/blocks', label: 'Blocks', icon: 'Component' },
    { path: '/forms', label: 'Forms', icon: 'FormInput' },
    { path: '/data', label: 'Data', icon: 'Database' },
    { path: '/advanced', label: 'Advanced', icon: 'Zap' }
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

  admin: {
    handler: definePage(async (interaction, ctx) => {
      ctx.log.info(`[ui-kit-tester] interaction`, interaction);

      // ─── Handle Button Actions ─────────────────────────────────────────────
      if (interaction.type === 'block_action') {
        if (interaction.blockId === 'kv-increment') {
          let counter = 0;
          try {
            const current = await ctx.kv.get('test:counter');
            counter = (typeof current === 'number' ? current : 0) + 1;
            await ctx.kv.set('test:counter', counter);
          } catch { }

          return (
            <Alert status="success" title="KV Counter Incremented">
              Current value: {counter}
            </Alert>
          );
        }

        if (interaction.blockId === 'kv-reset') {
          try {
            await ctx.kv.set('test:counter', 0);
          } catch { }
          return (
            <Alert status="info" title="KV Counter Reset">
              The counter has been set back to 0.
            </Alert>
          );
        }

        // Generic button feedback
        return {
          blocks: [
            <Alert status="success" title="Block Action Received">
              blockId: "{interaction.blockId}", value: {JSON.stringify(interaction.value ?? null)}
            </Alert>
          ],
          toast: { type: 'success', message: `Action "${interaction.blockId}" processed` }
        };
      }

      // ─── Handle Form Submission ────────────────────────────────────────────
      if (interaction.type === 'form_submit') {
        const entries = Object.entries(interaction.values)
          .map(([k, v]) => ({ key: k, value: String(v ?? '') }));

        return (
          <Page>
            <Alert status="success" title="Form Submitted Successfully">
              Received {entries.length} field(s) from form "{interaction.formId}".
            </Alert>
            <Table
              columns={[
                { key: 'key', label: 'Field' },
                { key: 'value', label: 'Value' }
              ]}
              rows={entries}
            />
            <Button id="back-to-forms" variant="outline">Back to Forms</Button>
          </Page>
        );
      }

      // ─── Widget ────────────────────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page.startsWith('__widget__/')) {
        const widgetId = interaction.page.replace('__widget__/', '');

        if (widgetId === 'summary') {
          let kvHits = 0;
          let hookCount = 0;

          try {
            const val = await ctx.kv.get('test:counter');
            kvHits = typeof val === 'number' ? val : 0;

            const hVal = await ctx.kv.get('stats:after_save_count');
            hookCount = typeof hVal === 'number' ? hVal : 0;
          } catch { }

          return (
            <Grid columns={3}>
              <Stat label="Plugin Version" value="1.0.0" />
              <Stat label="Content Saves" value={hookCount} change={hookCount > 0 ? 100 : 0} />
              <Stat label="KV Interactions" value={kvHits} change={kvHits > 0 ? 5 : 0} />
            </Grid>
          );
        }

        return <Text>Unknown widget: {widgetId}</Text>;
      }

      // ─── Overview Page ─────────────────────────────────────────────────────
      if (interaction.type === 'page_load' && (interaction.page === '/' || interaction.page === '')) {
        return (
          <Page>
            <Header size="xl">UI Kit Tester</Header>
            <Text>
              This plugin surfaces every Block Kit component. Navigate the pages to test individual block categories.
            </Text>
            <Divider />
            <Grid columns={3}>
              <Stat label="Block Types" value={14} />
              <Stat label="Interaction Types" value={3} />
              <Stat label="Admin Pages" value={4} change={100} />
            </Grid>
            <Divider />
            <Alert status="info" title="Getting Started">
              Use the sidebar to navigate to Blocks, Forms, or Data pages to see each UI component in action.
            </Alert>
            <Card title="React Extension Test" description="This block is a 'real' React component rendered via the block registry.">
              <Custom component="tester-component" props={{ initialCount: 42, label: 'Dynamic Counter' }} />
            </Card>
            <Card title="Plugin Context" description="Data exposed by the PluginContext at runtime.">
              <Text>Plugin ID: {ctx.plugin.id}</Text>
              <Text>Plugin Version: {ctx.plugin.version}</Text>
              <Text>Site: {ctx.site.name} ({ctx.site.url})</Text>
              <Text>Locale: {ctx.site.locale}</Text>
            </Card>
          </Page>
        );
      }

      // ─── Blocks Demo Page ──────────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/blocks') {
        return (
          <Page>
            <Header size="lg">Display Blocks</Header>
            <Text>
              All read-only display blocks: headers, text, dividers, alerts, stats, badges.
            </Text>
            <Divider />

            <Header size="xl">Header XL</Header>
            <Header size="lg">Header LG</Header>
            <Header size="md">Header MD</Header>
            <Header size="sm">Header SM</Header>

            <Divider />

            <Text>
              This is a regular text block. It can contain longer paragraphs of descriptive content.
            </Text>

            <Divider />

            <Grid columns={2}>
              <Alert status="info" title="Info Alert">This is an informational alert block.</Alert>
              <Alert status="success" title="Success Alert">The operation was completed successfully.</Alert>
              <Alert status="warning" title="Warning Alert">Proceed with caution.</Alert>
              <Alert status="destructive" title="Error Alert">Something went wrong.</Alert>
            </Grid>

            <Divider />

            <Grid columns={4}>
              <Stat label="Total Users" value={1024} change={12} />
              <Stat label="Active Sessions" value={47} />
              <Stat label="Uptime" value="99.9%" />
              <Stat label="Error Rate" value="0.01%" change={-50} />
            </Grid>
          </Page>
        );
      }

      // ─── Forms Demo Page ───────────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/forms') {
        return (
          <Page>
            <Header size="lg">Input Blocks & Forms</Header>
            <Text>
              All interactive input blocks and how they compose into a form with submission handling.
            </Text>
            <Divider />

            <Form action="demo-form" submitLabel="Submit Demo Form">
              <Grid columns={2}>
                <Input id="name" label="Full Name" placeholder="Enter your full name" required />
                <Input id="email" label="Email Address" placeholder="user@example.com" />
              </Grid>
              <Textarea id="bio" label="Bio" placeholder="Tell us about yourself..." rows={3} />

              <Grid columns={2}>
                <Select
                  id="role"
                  label="Role"
                  options={[
                    { label: 'Developer', value: 'developer' },
                    { label: 'Designer', value: 'designer' },
                    { label: 'Product Manager', value: 'pm' }
                  ]}
                />
                <Combobox
                  id="skills"
                  label="Primary Skill"
                  placeholder="Search skills..."
                  options={[
                    { label: 'React', value: 'react' },
                    { label: 'Cloudflare', value: 'cf' },
                    { label: 'TypeScript', value: 'ts' },
                    { label: 'Hono', value: 'hono' }
                  ]}
                />
              </Grid>

              <Grid columns={2}>
                <div className="space-y-4">
                  <Label>Interactive Settings</Label>
                  <Checkbox id="terms" label="Accept terms and conditions" />
                  <Toggle id="notifications" label="Enable Notifications" defaultValue={true} />
                </div>
                <div className="space-y-4">
                  <Label>Experience Level (Slider)</Label>
                  <Slider id="experience" min={0} max={10} step={1} value={5} />
                </div>
              </Grid>

              <div className="space-y-2">
                <Label>Verification Code (OTP)</Label>
                <InputOTP id="otp_code" length={6} />
              </div>
            </Form>

            <Divider />
            <Header size="md">AutoForm Demo (Zod-based)</Header>
            <Text>This form is automatically generated from a Zod schema.</Text>
            <Card>
              <AutoForm
                action="settings-update"
                schema={settingsSchema}
                submitLabel="Update Settings"
              />
            </Card>
          </Page>
        );
      }

      // ─── Data Table Demo Page ──────────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/data') {
        const stats = [
          { label: 'Revenue', value: '$12,450', change: 12 },
          { label: 'Visitors', value: '45.2k', change: -3 },
          { label: 'Conversion', value: '3.2%', change: 0.5 },
          { label: 'Churn', value: '1.2%', change: -0.2 }
        ];

        return (
          <Page>
            <Header size="lg">Data & Status</Header>
            <Breadcrumb items={[
              { label: 'Admin', href: '#' },
              { label: 'UI Kit', href: '#' },
              { label: 'Data' }
            ]} />

            <Divider />

            <Grid columns={4}>
              {stats.map(s => <Stat key={s.label} {...s} />)}
            </Grid>

            <Divider />

            <Table
              columns={[
                { key: 'user', label: 'User' },
                { key: 'status', label: 'Status' },
                { key: 'progress', label: 'Progress' },
                { key: 'joined', label: 'Last Active' }
              ]}
              rows={[
                {
                  user: <Item title="Alice Martin" description="alice@example.com" media={<Avatar fallback="AM" src="https://github.com/shadcn.png" />} />,
                  status: <Badge variant="default">Active</Badge>,
                  progress: <Progress value={85} />,
                  joined: '2 days ago'
                },
                {
                  user: <Item title="Bob Chen" description="bob@example.com" media={<Avatar fallback="BC" />} />,
                  status: <Badge variant="secondary">Away</Badge>,
                  progress: <Progress value={45} />,
                  joined: '5 hours ago'
                },
                {
                  user: <Item title="Clara Nunes" description="clara@example.com" media={<Avatar fallback="CN" />} />,
                  status: <Badge variant="outline">Guest</Badge>,
                  progress: <Progress value={10} />,
                  joined: 'Just now'
                }
              ]}
            />

            <Divider />

            <div className="flex justify-between items-center">
              <Text variant="muted">Showing 3 of 50 users</Text>
              <Pagination id="user-pagination" totalPages={10} currentPage={1} />
            </div>

            <Divider />

            <Card title="KV Store Tester" description="Test reading and writing to the Plugin KV store.">
              <ButtonGroup>
                <Button id="kv-increment" variant="default">Increment Counter in KV</Button>
                <Button id="kv-reset" variant="outline">Reset Counter</Button>
              </ButtonGroup>
            </Card>
          </Page>
        );
      }

      // ─── Advanced Components Page ──────────────────────────────────────────
      if (interaction.type === 'page_load' && interaction.page === '/advanced') {
        return (
          <Page>
            <Header size="lg">Advanced Layouts & Interactivity</Header>
            <Text>Complex components like Tabs, Accordion, Carousel, and Overlays.</Text>

            <Tabs defaultValue="overview" items={[
              {
                label: 'Overview',
                value: 'overview',
                children: [
                  <Grid columns={2}>
                    <Card title="Accordion Demo">
                      <Accordion items={[
                        { label: 'What is Block Kit?', children: 'Block Kit is a declarative UI system for FlareCMS plugins.' },
                        { label: 'How does JSX work here?', children: 'We use a custom JSX runtime that serializes your components into JSON blocks.' },
                        { label: 'Can I use custom React components?', children: 'Yes, using the Custom block and registering it in the client.' }
                      ]} />
                    </Card>
                    <Card title="Carousel Demo">
                      <Carousel items={[
                        [<Alert status="info" title="Slide 1">Check out component A</Alert>],
                        [<Alert status="success" title="Slide 2">Check out component B</Alert>],
                        [<Alert status="warning" title="Slide 3">Check out component C</Alert>]
                      ]} />
                    </Card>
                  </Grid>
                ]
              },
              {
                label: 'Interactions',
                value: 'interactions',
                children: [
                  <Card title="Overlays & Modals">
                    <ButtonGroup>
                      <Dialog
                        title="Edit Profile"
                        description="Make changes to your profile here."
                        trigger="Open Dialog"
                      >
                        <Form action="dialog-form" submitLabel="Save Changes">
                          <Input id="d-name" label="Name" defaultValue="User Name" />
                          <Input id="d-email" label="Email" defaultValue="user@example.com" />
                        </Form>
                      </Dialog>

                      <Sheet
                        side="right"
                        title="Notifications"
                        description="Check your recent activity."
                        trigger="Open Sheet"
                      >
                        <ScrollArea height={400}>
                          <Grid columns={1}>
                            <Item title="New Login" description="A new device logged into your account." media={<Badge variant="outline">Security</Badge>} />
                            <Item title="Update Available" description="Version 2.0 is now available for download." media={<Badge variant="secondary">System</Badge>} />
                            <Item title="Welcome!" description="Thanks for joining the FlareCMS beta." media={<Badge variant="default">Info</Badge>} />
                          </Grid>
                        </ScrollArea>
                      </Sheet>
                    </ButtonGroup>
                  </Card>
                ]
              },
              {
                label: 'System',
                value: 'system',
                children: [
                  <Card title="Loading States">
                    <Grid columns={3}>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="sm" />
                        <Text variant="muted">Small</Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="md" />
                        <Text variant="muted">Medium</Text>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="lg" />
                        <Text variant="muted">Large</Text>
                      </div>
                    </Grid>
                  </Card>
                ]
              }
            ]} />
          </Page>
        );
      }

      // ─── Fallback ──────────────────────────────────────────────────────────
      return (
        <Alert status="warning" title="Unhandled Interaction">
          Interaction type "{interaction.type}" was not handled.
        </Alert>
      );
    })
  }
});