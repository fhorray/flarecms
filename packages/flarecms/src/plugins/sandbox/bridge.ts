import { WorkerEntrypoint } from 'cloudflare:workers';
import { sql } from 'kysely';
import { createDb } from '../../db/index';
import type { PluginBridgeInterface, PluginBridgeProps, PluginBridgeEnv } from './types';

/**
 * PluginBridge is the RPC gateway that runs in the Host process.
 * It exposes secure methods to the Sandboxed Plugin via Service Bindings.
 */
export class PluginBridge
	extends WorkerEntrypoint<PluginBridgeEnv>
	implements PluginBridgeInterface {
	private props: PluginBridgeProps;

	constructor(ctx: any, env: PluginBridgeEnv) {
		super(ctx, env);
		// Props are passed when the Entrypoint is instantiated via ctx.exports
		this.props = (ctx as any).props;
	}

	private get db() {
		return createDb(this.env.DB);
	}

	private hasCap(cap: string) {
		return this.props.capabilities.includes(cap as any);
	}

	// ── KV Implementation ──

	async kvGet(key: string) {
		const res = await this.db
			.selectFrom('_fc_plugin_storage' as any)
			.select('data')
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', '_kv')
			.where('id', '=', key)
			.executeTakeFirst();
		return res ? JSON.parse(res.data) : null;
	}

	async kvSet(key: string, value: any) {
		await sql`
			INSERT INTO _fc_plugin_storage (plugin_id, collection, id, data)
			VALUES (${this.props.pluginId}, '_kv', ${key}, ${JSON.stringify(value)})
			ON CONFLICT(plugin_id, collection, id) DO UPDATE SET
				data = excluded.data,
				updated_at = CURRENT_TIMESTAMP
		`.execute(this.db);
	}

	async kvDelete(key: string) {
		const res = await this.db
			.deleteFrom('_fc_plugin_storage' as any)
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', '_kv')
			.where('id', '=', key)
			.executeTakeFirst();
		return !!res;
	}

	async kvList(prefix?: string) {
		let query = this.db
			.selectFrom('_fc_plugin_storage' as any)
			.select(['id', 'data'])
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', '_kv');

		if (prefix) {
			query = query.where('id', 'like', `${prefix}%`);
		}

		const results = await query.execute();
		return results.map((r: any) => ({
			key: r.id,
			value: JSON.parse(r.data),
		}));
	}

	// ── Storage Implementation ──

	async storageGet(collection: string, id: string) {
		if (!this.props.storageCollections.includes(collection)) {
			throw new Error(`Storage collection "${collection}" not declared by plugin.`);
		}
		const res = await this.db
			.selectFrom('_fc_plugin_storage' as any)
			.select('data')
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', collection)
			.where('id', '=', id)
			.executeTakeFirst();
		return res ? JSON.parse(res.data) : null;
	}

	async storagePut(collection: string, id: string, data: any) {
		if (!this.props.storageCollections.includes(collection)) {
			throw new Error(`Storage collection "${collection}" not declared by plugin.`);
		}
		await sql`
			INSERT INTO _fc_plugin_storage (plugin_id, collection, id, data)
			VALUES (${this.props.pluginId}, ${collection}, ${id}, ${JSON.stringify(data)})
			ON CONFLICT(plugin_id, collection, id) DO UPDATE SET
				data = excluded.data,
				updated_at = CURRENT_TIMESTAMP
		`.execute(this.db);
	}

	async storageDelete(collection: string, id: string) {
		if (!this.props.storageCollections.includes(collection)) {
			throw new Error(`Storage collection "${collection}" not declared by plugin.`);
		}
		const res = await this.db
			.deleteFrom('_fc_plugin_storage' as any)
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', collection)
			.where('id', '=', id)
			.executeTakeFirst();
		return !!res;
	}

	async storageQuery(collection: string, opts?: any) {
		if (!this.props.storageCollections.includes(collection)) {
			throw new Error(`Storage collection "${collection}" not declared by plugin.`);
		}
		const limit = opts?.limit ?? 20;
		const results = await this.db
			.selectFrom('_fc_plugin_storage' as any)
			.select(['id', 'data'])
			.where('plugin_id', '=', this.props.pluginId)
			.where('collection', '=', collection)
			.limit(limit)
			.execute();

		return {
			items: results.map((r: any) => JSON.parse(r.data)),
			hasMore: results.length === limit,
		};
	}

	// ── Content Implementation ──

	async contentGet(collection: string, id: string) {
		if (!this.hasCap('read:content')) throw new Error('Missing capability: read:content');
		return await this.db
			.selectFrom(`ec_${collection}` as any)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst();
	}

	async contentList(collection: string, opts?: any) {
		if (!this.hasCap('read:content')) throw new Error('Missing capability: read:content');
		const limit = opts?.limit ?? 20;
		const items = await this.db
			.selectFrom(`ec_${collection}` as any)
			.selectAll()
			.where('status', '!=', 'deleted')
			.limit(limit)
			.execute();
		return { items, hasMore: items.length === limit };
	}

	async contentCreate(collection: string, data: any) {
		if (!this.hasCap('write:content')) throw new Error('Missing capability: write:content');
		return await this.db.insertInto(`ec_${collection}` as any).values(data).execute();
	}

	async contentUpdate(collection: string, id: string, data: any) {
		if (!this.hasCap('write:content')) throw new Error('Missing capability: write:content');
		return await this.db
			.updateTable(`ec_${collection}` as any)
			.set(data)
			.where('id', '=', id)
			.execute();
	}

	async contentDelete(collection: string, id: string) {
		if (!this.hasCap('write:content')) throw new Error('Missing capability: write:content');
		return !!(await this.db
			.deleteFrom(`ec_${collection}` as any)
			.where('id', '=', id)
			.execute());
	}

	// ── HTTP Implementation ──

	async httpFetch(url: string, init?: any) {
		if (!this.hasCap('network:fetch')) throw new Error('Missing capability: network:fetch');

		const target = new URL(url);
		if (!this.hasCap('network:fetch:any') && !this.props.allowedHosts.includes(target.hostname)) {
			throw new Error(`Host "${target.hostname}" not in allowedHosts list.`);
		}

		const response = await fetch(url, init);
		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});
		const text = await response.text();

		return {
			status: response.status,
			ok: response.ok,
			headers,
			text,
		};
	}

	// ── Log Implementation ──

	log(level: string, message: string, data?: any) {
		const prefix = `[${this.props.pluginId}] ${level.toUpperCase()}:`;
		console.log(prefix, message, data ?? '');
	}
}
