import { describe, expect, it, mock } from 'bun:test';
import { ui } from '../src/plugins/ui';
import { route } from '../src/plugins/route';
import { action } from '../src/plugins/action';
import { PluginManager } from '../src/plugins/manager';
import type { ResolvedPlugin } from '../src/plugins/types';
import { z } from 'zod';

describe('Plugin DX Improvements', () => {
  describe('UI Builder', () => {
    it('builds text and header blocks', () => {
      const b1 = ui.header('Hello World', { size: 'lg' });
      expect(b1).toEqual({ type: 'header', text: 'Hello World', size: 'lg' });

      const b2 = ui.text('Description here', { className: 'text-sm' });
      expect(b2).toEqual({ type: 'text', text: 'Description here', className: 'text-sm' });
    });

    it('builds table blocks', () => {
      const tbl = ui.table(['Name', 'Age'], [['John', 30], ['Jane', 25]]);
      expect(tbl).toEqual({
        type: 'table',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' }
        ],
        rows: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      });
    });

    it('builds complete responses', () => {
      const res = ui.page([ui.header('Dashboard')]);
      expect(res).toEqual({ blocks: [{ type: 'header', text: 'Dashboard' }] });

      const redir = ui.redirect('/login', { toast: ui.toast('success', 'Logged out') });
      expect(redir).toEqual({ redirect: '/login', toast: { type: 'success', message: 'Logged out' } });

      const dlg = ui.response({ dialog: ui.alertDialog('Confirm', { description: 'Are you sure?' }) });
      expect(dlg).toEqual({
        blocks: undefined,
        dialog: { type: 'alert_dialog', title: 'Confirm', description: 'Are you sure?' },
        toast: undefined,
        redirect: undefined
      });
    });
  });

  describe('Route Builder', () => {
    it('creates routes with inferred validation and handlers', async () => {
      const r = route.post()
        .input(z.object({ name: z.string(), age: z.number() }))
        .handler(async ({ input }) => {
          return { message: `Hello ${input.name}, you are ${input.age} years old.` };
        });

      expect(r.method).toBe('POST');
      expect(r.input).toBeDefined();

      const res = await r.handler({
        input: { name: 'Alice', age: 28 },
        request: {} as any,
        requestMeta: {} as any
      }, {} as any);

      expect(res).toEqual({ message: 'Hello Alice, you are 28 years old.' });
    });
  });

  describe('Action Builder', () => {
    it('creates actions with inferred validation', async () => {
      const a = action.define()
        .input(z.object({ email: z.string().email() }))
        .handler(async ({ input }) => {
          return ui.response({ toast: ui.toast('success', `Sent to ${input.email}`) });
        });

      // Test valid submission
      const validRes = await a({ type: 'form_submit', formId: 'f1', values: { email: 'test@example.com' } }, {} as any);
      expect(validRes.toast).toEqual({ type: 'success', message: 'Sent to test@example.com' });

      // Test invalid submission
      const invalidRes = await a({ type: 'form_submit', formId: 'f1', values: { email: 'not-an-email' } }, {} as any);
      expect(invalidRes.toast).toEqual({ type: 'error', message: 'Validation failed. Please check your inputs.' });
      expect(invalidRes.blocks).toEqual([]);
    });
  });

  describe('Plugin Manager Core Flow', () => {
    const mockDb = {} as any;
    const mockSiteInfo = { name: 'Test', url: 'test.com', locale: 'en' };

    it('routes page_load to declarative pages', async () => {
      const plugin: ResolvedPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        capabilities: [], allowedHosts: [], storage: {}, hooks: {}, routes: {},
        adminWidgets: [],
        pages: [
          {
            path: '/settings',
            label: 'Settings',
            render: async () => ui.page([ui.header('Settings Page')])
          }
        ],
        actions: {}
      };

      const manager = new PluginManager([plugin], mockDb, mockSiteInfo);

      const res = await manager.invokeAdmin('test-plugin', { type: 'page_load', page: '/settings' });
      expect(res.blocks).toEqual([{ type: 'header', text: 'Settings Page' }]);
    });

    it('routes actions and passes prefix params correctly', async () => {
      const plugin: ResolvedPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        capabilities: [], allowedHosts: [], storage: {}, hooks: {}, routes: {},
        adminWidgets: [], pages: [],
        actions: {
          'delete-user': async (interaction) => {
            const userId = interaction.actionParams?.[0];
            return ui.response({ toast: ui.toast('info', `Deleted user ${userId}`) });
          }
        }
      };

      const manager = new PluginManager([plugin], mockDb, mockSiteInfo);

      const res = await manager.invokeAdmin('test-plugin', { type: 'block_action', blockId: 'delete-user:12345' });
      expect(res.toast).toEqual({ type: 'info', message: 'Deleted user 12345' });
    });
  });
});
