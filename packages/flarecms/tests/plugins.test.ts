import { expect, test, describe, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { sql } from 'kysely';
import { adaptEntry, createPluginContext, definePlugin, PluginManager } from '../src/index.js';
import { HookPipeline } from '../src/plugins/hooks.js';
import { PluginRouteRegistry } from '../src/plugins/routes.js';

// Setup happy-dom globally for React components
GlobalRegistrator.register();

// Mock kysely's sql tagged template
mock.module('kysely', () => ({
  sql: (strings: any, ...values: any[]) => {
    return {
      execute: async (db: any) => {
        // We inject this mock directly to our test database wrapper.
        if (db._test_execute_sql) {
          return db._test_execute_sql(strings, values);
        }
      }
    }
  }
}));

describe('FlareCMS Plugin System', () => {

  describe('Plugin Definition (definePlugin, adaptEntry)', () => {
    test('definePlugin validates presence of required fields', () => {
      expect(() => definePlugin({} as any)).toThrow('Invalid plugin definition');

      const validPlugin = definePlugin({
        hooks: { 'content:afterSave': async () => { } }
      } as any);
      expect(validPlugin.hooks).toBeDefined();
    });

    test('adaptEntry maps properties correctly', () => {
      const entry = adaptEntry({
        id: 'test-plugin',
        version: '1.0.0',
        format: 'standard',
        entrypoint: 'index.ts',
        capabilities: ['read:content'],
        hooks: {
          'content:beforeSave': {
            priority: 10,
            timeout: 1000,
            handler: async (e) => e
          }
        },
        adminPages: [{ path: '/', label: 'Home' }]
      });

      expect(entry.id).toBe('test-plugin');
      expect(entry.version).toBe('1.0.0');
      expect(entry.capabilities).toEqual(['read:content']);
      expect(entry.hooks['content:beforeSave']?.priority).toBe(10);
      expect(entry.adminPages.length).toBe(1);
    });
  });

  describe('Context (context.ts)', () => {
    let dbMock: any;
    let mockStorageMap: Map<string, any>;

    beforeEach(() => {
      mockStorageMap = new Map();

      dbMock = {
        fn: { count: () => ({}) },
        selectFrom: (table: string) => ({
          select: (cols: any) => ({
            where: (c1: string, o1: string, v1: string) => ({
              where: (c2: string, o2: string, v2: string) => ({
                where: (c3: string, o3: string, v3: string) => ({
                  executeTakeFirst: async () => {
                    // In actual implementation v1 is pluginId, v2 is collection, v3 is id
                    // Wait, looking at the code for KV get:
                    // .where('plugin_id', '=', pluginId)
                    // .where('collection', '=', '_kv')
                    // .where('id', '=', key)
                    const key = `${v1}_${v2}_${v3}`;
                    // console.log('GET', {v1, v2, v3, key, has: mockStorageMap.has(key), data: mockStorageMap.get(key)});
                    if (mockStorageMap.has(key)) {
                      return { data: JSON.stringify(mockStorageMap.get(key)), count: 1 };
                    }
                    return null;
                  }
                }),
                execute: async () => {
                  const results = [];
                  for (const [k, v] of mockStorageMap.entries()) {
                    if (k.startsWith(`${v1}_${v2}_`)) {
                      results.push({ id: k.split('_').pop(), data: JSON.stringify(v) });
                    }
                  }
                  return results;
                },
                limit: (limit: number) => ({
                  execute: async () => {
                    const results = [];
                    for (const [k, v] of mockStorageMap.entries()) {
                      if (k.startsWith(`${v1}_${v2}_`)) {
                        results.push({ id: k.split('_').pop(), data: JSON.stringify(v) });
                      }
                    }
                    return results.slice(0, limit);
                  }
                })
              })
            })
          })
        }),
        deleteFrom: (table: string) => ({
          where: (c1: string, o1: string, v1: string) => ({
            where: (c2: string, o2: string, v2: string) => ({
              where: (c3: string, o3: string, v3: string) => ({
                executeTakeFirst: async () => {
                  const key = `${v1}_${v2}_${v3}`;
                  // console.log('GET', {v1, v2, v3, key, has: mockStorageMap.has(key), data: mockStorageMap.get(key)});
                  return mockStorageMap.delete(key) ? { deleted: true } : null;
                }
              })
            })
          })
        }),
        _test_execute_sql: async (strings: any, values: any[]) => {
          const str = strings.join('?');
          let pluginId, collection, id, data;

          if (str.includes("'_kv'")) {
            pluginId = values[0];
            collection = '_kv';
            id = values[1];
            data = values[2];
          } else {
            pluginId = values[0];
            collection = values[1];
            id = values[2];
            data = values[3];
          }

          const key = `${pluginId}_${collection}_${id}`;
          mockStorageMap.set(key, typeof data === "string" ? JSON.parse(data) : data);
          return { numInsertedOrUpdatedRows: 1 };
        }

      };
    });

    test('KV operations work securely', async () => {
      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: [],
        allowedHosts: [],
        storageCollections: [],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' }
      });

      await ctx.kv.set('my-key', { foo: 'bar' });

      const val = await ctx.kv.get('my-key');
      expect(val).toEqual({ foo: 'bar' });

      const list = await ctx.kv.list();
      expect(list.length).toBe(1);
      expect(list[0]?.key).toBe('my-key');

      await ctx.kv.delete('my-key');
      const deletedVal = await ctx.kv.get('my-key');
      expect(deletedVal).toBeNull();
    });

    test('Storage collections are isolated and restricted', async () => {
      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: [],
        allowedHosts: [],
        storageCollections: ['my_collection'],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' }
      });

      // Allowed collection
      await ctx.storage.my_collection?.put('item1', { a: 1 });
      const val = await ctx.storage.my_collection?.get('item1');
      expect(val).toEqual({ a: 1 });

      const queryRes = await ctx.storage.my_collection?.query();
      expect(queryRes?.items.length).toBe(1);

      // Disallowed collection
      expect(() => {
        ctx.storage.unauthorized_collection?.get('item');
      }).toThrow('attempted to access undeclared storage collection');
    });

    test('HTTP fetch capabilities enforce allowedHosts', async () => {
      // Mock global fetch
      const originalFetch = global.fetch;
      global.fetch = mock(async () => new Response('ok', { status: 200 })) as any;

      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: ['network:fetch'],
        allowedHosts: ['api.github.com'],
        storageCollections: [],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' }
      });

      // Allowed host
      const res = await ctx.http?.fetch('https://api.github.com/users');
      expect(res?.status).toBe(200);

      // Disallowed host
      await expect(ctx.http?.fetch('https://malicious.com/api')).rejects.toThrow('is not in the allowedHosts list');

      global.fetch = originalFetch;
    });

    test('HTTP any capability bypasses allowedHosts', async () => {
      const originalFetch = global.fetch;
      global.fetch = mock(async () => new Response('ok', { status: 200 })) as any;

      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: ['network:fetch', 'network:fetch:any'],
        allowedHosts: [], // No explicit hosts
        storageCollections: [],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' }
      });

      const res = await ctx.http?.fetch('https://any-domain.com/data');
      expect(res?.status).toBe(200);

      global.fetch = originalFetch;
    });

    test('Crypto encryption requires a secret and correctly encrypts/decrypts', async () => {
      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: ['crypto:encrypt'],
        allowedHosts: [],
        storageCollections: [],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' },
        encryptionSecret: 'super-secret-key-that-is-long-enough'
      });

      const plaintext = 'sensitive-api-key';
      const ciphertext = await ctx.crypto?.encrypt(plaintext);

      expect(ciphertext).not.toBe(plaintext);
      expect(typeof ciphertext).toBe('string');

      const decrypted = await ctx.crypto?.decrypt(ciphertext!);
      expect(decrypted).toBe(plaintext);
    });

    test('Crypto operations throw if secret is missing', async () => {
      const ctx = createPluginContext({
        pluginId: 'test-plugin',
        version: '1.0.0',
        capabilities: ['crypto:encrypt'],
        allowedHosts: [],
        storageCollections: [],
        db: dbMock as any,
        siteInfo: { name: 'Test', url: 'http://localhost', locale: 'en' },
        // No secret provided
      });

      await expect(ctx.crypto?.encrypt('text')).rejects.toThrow('Encryption secret not configured');
    });
  });

});

describe('Hooks (hooks.ts)', () => {
  test('runChain modifies data in a waterfall', async () => {
    const pipeline = new HookPipeline([{
      id: 'p1', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p1',
          priority: 10,
          timeout: 1000,
          handler: async (data: any) => ({ ...data, a: 1 })
        }
      }
    }, {
      id: 'p2', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p2',
          priority: 20,
          timeout: 1000,
          handler: async (data: any) => ({ ...data, b: 2 })
        }
      }
    }] as any, {} as any, { name: 't', url: 't', locale: 't' });

    const result = await pipeline.runChain('my-hook', { base: 0 });
    expect(result).toEqual({ base: 0, a: 1, b: 2 });
  });

  test('runParallel runs independently', async () => {
    let c = 0;
    const pipeline = new HookPipeline([{
      id: 'p1', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p1',
          priority: 10,
          timeout: 1000,
          handler: async () => { c++; }
        }
      }
    }, {
      id: 'p2', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p2',
          priority: 20,
          timeout: 1000,
          handler: async () => { c++; }
        }
      }
    }] as any, {} as any, { name: 't', url: 't', locale: 't' });

    await pipeline.runParallel('my-hook', {});
    expect(c).toBe(2);
  });

  test('runVeto aborts if false is returned', async () => {
    const pipeline = new HookPipeline([{
      id: 'p1', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p1',
          priority: 10,
          timeout: 1000,
          handler: async () => false
        }
      }
    }, {
      id: 'p2', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p2',
          priority: 20,
          timeout: 1000,
          handler: async () => true
        }
      }
    }] as any, {} as any, { name: 't', url: 't', locale: 't' });

    const result = await pipeline.runVeto('my-hook', {});
    expect(result).toBe(false);
  });

  test('hook timeouts throw an error gracefully without crashing parallel', async () => {
    const pipeline = new HookPipeline([{
      id: 'p1', storage: {},
      hooks: {
        'my-hook': {
          pluginId: 'p1',
          priority: 10,
          timeout: 50, // 50ms timeout
          handler: async () => new Promise(r => setTimeout(r, 100))
        }
      }
    }] as any, {} as any, { name: 't', url: 't', locale: 't' });

    // We suppress console error for this test since runParallel logs it
    const errorSpy = spyOn(console, 'error').mockImplementation(() => { });

    await pipeline.runParallel('my-hook', {});

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0]?.[1].message).toMatch(/timed out after 50ms/);

    errorSpy.mockRestore();
  });
});

describe('Routes (routes.ts)', () => {
  test('invokes route and passes context', async () => {
    const registry = new PluginRouteRegistry({} as any, { name: 't', url: 't', locale: 't' });
    registry.register({
      id: 'my-plugin',
      version: '1.0.0',
      capabilities: [],
      allowedHosts: [],
      storage: {},
      routes: {
        'my-route': {
          public: true,
          handler: async (routeCtx: any, ctx: any) => {
            return {
              received: routeCtx.input,
              pluginId: ctx.plugin.id
            };
          }
        }
      }
    } as any);

    const result = await registry.invoke('my-plugin', 'my-route', {
      input: { val: 42 },
      request: { url: '', method: 'GET', headers: {}, meta: { ip: null, userAgent: null, referer: null } }
    });

    expect(result).toEqual({
      received: { val: 42 },
      pluginId: 'my-plugin'
    });
  });

  test('throws if route not found', async () => {
    const registry = new PluginRouteRegistry({} as any, { name: 't', url: 't', locale: 't' });
    await expect(registry.invoke('unknown-plugin', 'route', { input: {}, request: {} as any })).rejects.toThrow();
  });
});

describe('Manager (manager.ts)', () => {
  test('invokeAdmin routes block interactions to admin handlers', async () => {
    const manager = new PluginManager([{
      id: 'admin-plugin', storage: {}, capabilities: [], allowedHosts: [], version: '1.0.0',
      hooks: {},
      routes: {},
      admin: {
        handler: async (interaction: any, ctx: any) => {
          if (interaction.type === 'page_load') {
            return { blocks: [{ type: 'text', text: 'hello admin' }] };
          }
          return { blocks: [] };
        }
      }
    }] as any, {} as any, { name: 't', url: 't', locale: 't' });

    const response = await manager.invokeAdmin('admin-plugin', { type: 'page_load', page: '/' } as any);
    expect(response.blocks).toEqual([{ type: 'text', text: 'hello admin' }]);
  });
});


describe('UI/Block Kit (happy-dom)', () => {
  // Mimic the example component from PLUGINS.md
  function MyInteractiveMap({ initialLat, onAction }: { initialLat: number, onAction: (a: any) => void }) {
    const [lat, setLat] = useState(initialLat);

    return React.createElement('div', null,
      React.createElement('p', null, `Current Lat: ${lat}`),
      React.createElement('button', {
        'data-testid': 'sync-btn',
        onClick: () => {
          const newLat = lat + 1;
          setLat(newLat);
          onAction({ type: 'block_action', blockId: 'map-move', value: newLat });
        }
      }, 'Sync with Server')
    );
  }

  test('Custom React block component triggers onAction properly', () => {
    let actionPayload: any = null;

    const { getByText, getByTestId } = render(
      React.createElement(MyInteractiveMap, {
        initialLat: 45.523,
        onAction: (a: any) => { actionPayload = a; }
      })
    );

    expect(getByText('Current Lat: 45.523')).not.toBeNull();

    const btn = getByTestId('sync-btn');
    fireEvent.click(btn);

    expect(getByText('Current Lat: 46.523')).not.toBeNull();
    expect(actionPayload).toEqual({
      type: 'block_action',
      blockId: 'map-move',
      value: 46.523
    });
  });
});
