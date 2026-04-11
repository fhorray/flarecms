import { sql } from 'kysely';
import type { Headers } from '@cloudflare/workers-types';
import type { FlareDb } from '../db/index';
import type {
	PluginContext,
	PluginCapability,
	PluginKV,
	PluginStorageCollection,
	PluginContentAccess,
	PluginHttpAccess,
	PluginLogger,
	PluginUsersAccess,
	PluginEmailAccess,
} from './types';

export interface ContextFactoryOptions {
	pluginId: string;
	version: string;
	capabilities: PluginCapability[];
	allowedHosts: string[];
	storageCollections: string[];
	db: FlareDb;
	siteInfo: { name: string; url: string; locale: string };
	encryptionSecret?: string;
}

/**
 * Creates an in-process (trusted) PluginContext.
 * Operations are executed directly against the provided database.
 */
export function createPluginContext(options: ContextFactoryOptions): PluginContext {
	const { pluginId, version, capabilities, allowedHosts, storageCollections, db, siteInfo } = options;

	const hasCap = (cap: PluginCapability) => capabilities.includes(cap);

	// ── Logging ──
	const log: PluginLogger = {
		debug: (msg, data) => console.debug(`[${pluginId}] DEBUG: ${msg}`, data ?? ''),
		info: (msg, data) => console.info(`[${pluginId}] INFO: ${msg}`, data ?? ''),
		warn: (msg, data) => console.warn(`[${pluginId}] WARN: ${msg}`, data ?? ''),
		error: (msg, data) => console.error(`[${pluginId}] ERROR: ${msg}`, data ?? ''),
	};

	// ── KV (Scoped to _fc_plugin_storage with collection '_kv') ──
	const kv: PluginKV = {
		get: async (key) => {
			const res = await db
				.selectFrom('_fc_plugin_storage')
				.select('data')
				.where('plugin_id', '=', pluginId)
				.where('collection', '=', '_kv')
				.where('id', '=', key)
				.executeTakeFirst();
			return res ? JSON.parse(res.data) : null;
		},
		set: async (key, value) => {
			await sql`
				INSERT INTO _fc_plugin_storage (plugin_id, collection, id, data)
				VALUES (${pluginId}, '_kv', ${key}, ${JSON.stringify(value)})
				ON CONFLICT(plugin_id, collection, id) DO UPDATE SET
					data = excluded.data,
					updated_at = CURRENT_TIMESTAMP
			`.execute(db);
		},
		delete: async (key) => {
			const res = await db
				.deleteFrom('_fc_plugin_storage')
				.where('plugin_id', '=', pluginId)
				.where('collection', '=', '_kv')
				.where('id', '=', key)
				.executeTakeFirst();
			return !!res;
		},
		list: async (prefix) => {
			let query = db
				.selectFrom('_fc_plugin_storage')
				.select(['id', 'data'])
				.where('plugin_id', '=', pluginId)
				.where('collection', '=', '_kv');

			if (prefix) {
				query = query.where('id', 'like', `${prefix}%`);
			}

			const results = await query.execute();
			return results.map((r: { id: string; data: string }) => ({
				key: r.id,
				value: JSON.parse(r.data),
			}));
		},
	};

	// ── Storage Proxy ──
	const storage: Record<string, PluginStorageCollection> = new Proxy(
		{},
		{
			get: (_, collection: string) => {
				if (!storageCollections.includes(collection)) {
					throw new Error(
						`Plugin "${pluginId}" attempted to access undeclared storage collection "${collection}".`,
					);
				}

				return {
					get: async (id: string) => {
						const res = await db
							.selectFrom('_fc_plugin_storage')
							.select('data')
							.where('plugin_id', '=', pluginId)
							.where('collection', '=', collection)
							.where('id', '=', id)
							.executeTakeFirst();
						return res ? JSON.parse(res.data) : null;
					},
					put: async (id: string, data: unknown) => {
						await sql`
							INSERT INTO _fc_plugin_storage (plugin_id, collection, id, data)
							VALUES (${pluginId}, ${collection}, ${id}, ${JSON.stringify(data)})
							ON CONFLICT(plugin_id, collection, id) DO UPDATE SET
								data = excluded.data,
								updated_at = CURRENT_TIMESTAMP
						`.execute(db);
					},
					delete: async (id: string) => {
						const res = await db
							.deleteFrom('_fc_plugin_storage')
							.where('plugin_id', '=', pluginId)
							.where('collection', '=', collection)
							.where('id', '=', id)
							.executeTakeFirst();
						return !!res;
					},
					query: async (opts?: { limit?: number; cursor?: string }) => {
						const limit = opts?.limit ?? 20;
						let query = db
							.selectFrom('_fc_plugin_storage')
							.select(['id', 'data'])
							.where('plugin_id', '=', pluginId)
							.where('collection', '=', collection)
							.limit(limit);

						// Basic implementation: future should handle cursors via updated_at/id
						const results = await query.execute();
						return {
							items: results.map((r: { id: string; data: string }) => JSON.parse(r.data)),
							hasMore: results.length === limit,
						};
					},
					count: async () => {
						const res = (await db
							.selectFrom('_fc_plugin_storage')
							.select(db.fn.count('id').as('count'))
							.where('plugin_id', '=', pluginId)
							.where('collection', '=', collection)
							.executeTakeFirst());
						return Number(res?.count ?? 0);
					},
				};
			},
		},
	);

	// ── Content Access ──
	let content: PluginContentAccess | undefined;
	if (hasCap('read:content')) {
		content = {
			get: async (col, id) => {
				const res = await db
					.selectFrom(`ec_${col}`)
					.selectAll()
					.where('id', '=', id)
					.executeTakeFirst();
				return res || null;
			},
			list: async (col, opts) => {
				const limit = opts?.limit ?? 20;
				const res = await db
					.selectFrom(`ec_${col}`)
					.selectAll()
					.where('status', '!=', 'deleted')
					.limit(limit)
					.execute();
				return { items: res, hasMore: res.length === limit };
			},
			create: async (col, data) => {
				if (!hasCap('write:content')) throw new Error('Capability write:content required');
				// Note: Real implementation would use the internal content service to handle slugs etc.
				// This is the bridge layer.
				return await db.insertInto(`ec_${col}`).values(data).execute();
			},
			update: async (col, id, data) => {
				if (!hasCap('write:content')) throw new Error('Capability write:content required');
				return await db.updateTable(`ec_${col}`).set(data).where('id', '=', id).execute();
			},
			delete: async (col, id) => {
				if (!hasCap('write:content')) throw new Error('Capability write:content required');
				return !!(await db.deleteFrom(`ec_${col}`).where('id', '=', id).execute());
			},
		};
	}

	// ── HTTP Access ──
	let http: PluginHttpAccess | undefined;
	if (hasCap('network:fetch')) {
		http = {
			fetch: async (url, init) => {
				const target = new URL(url);
				if (!hasCap('network:fetch:any') && !allowedHosts.includes(target.hostname)) {
					throw new Error(
						`Host "${target.hostname}" is not in the allowedHosts list for plugin "${pluginId}".`,
					);
				}

				const response = await fetch(url, init);
				return {
					status: response.status,
					ok: response.ok,
					headers: response.headers as unknown as Headers,
					text: () => response.text(),
					json: () => response.json() as Promise<unknown>,
				};
			},
		};
	}

	// ── Placeholder Accessors ──
	let users: PluginUsersAccess | undefined;
	if (hasCap('read:users')) {
		users = {
			get: async (id) =>
				db.selectFrom('fc_users').selectAll().where('id', '=', id).executeTakeFirst(),
			list: async (opts) => {
				const items = await db.selectFrom('fc_users').selectAll().limit(opts?.limit ?? 20).execute();
				return { items };
			},
		};
	}

	// ── Crypto Access ──
	let crypto: any;
	if (hasCap('crypto:encrypt')) {
		crypto = {
			encrypt: async (text: string) => {
				if (!options.encryptionSecret) throw new Error('Encryption secret not configured');
				return await encryptText(text, options.encryptionSecret);
			},
			decrypt: async (ciphertext: string) => {
				if (!options.encryptionSecret) throw new Error('Encryption secret not configured');
				return await decryptText(ciphertext, options.encryptionSecret);
			}
		};
	}

	// ── Final Context ──
	return {
		plugin: { id: pluginId, version },
		kv,
		storage,
		content,
		media: undefined, // Implement storage integration later
		http,
		log,
		site: siteInfo,
		users,
		email: undefined,
		crypto,
	};
}

/**
 * Helper to encrypt text using Web Crypto API
 */
async function encryptText(text: string, secret: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await globalThis.crypto.subtle.importKey(
		'raw',
		enc.encode(secret.padEnd(32, '0').slice(0, 32)),
		{ name: 'AES-GCM' },
		false,
		['encrypt']
	);
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await globalThis.crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		enc.encode(text)
	);

	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);

	return btoa(String.fromCharCode(...combined));
}

/**
 * Helper to decrypt text using Web Crypto API
 */
async function decryptText(ciphertext: string, secret: string): Promise<string> {
	const enc = new TextEncoder();
	const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
	const iv = combined.slice(0, 12);
	const data = combined.slice(12);

	const key = await globalThis.crypto.subtle.importKey(
		'raw',
		enc.encode(secret.padEnd(32, '0').slice(0, 32)),
		{ name: 'AES-GCM' },
		false,
		['decrypt']
	);

	const decrypted = await globalThis.crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		key,
		data
	);

	return new TextDecoder().decode(decrypted);
}
