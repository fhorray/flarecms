import type { ResolvedPlugin, ResolvedHook, PluginContext } from './types.js';
import { createPluginContext, type ContextFactoryOptions } from './context.js';
import type { FlareDb } from '../db/index.js';

/**
 * HookPipeline manages the registration and execution of hooks across all plugins.
 */
export class HookPipeline {
	private hooks: Record<string, ResolvedHook[]> = {};
	private plugins: ResolvedPlugin[] = [];
	private db: FlareDb;
	private siteInfo: { name: string; url: string; locale: string };

	constructor(
		plugins: ResolvedPlugin[],
		db: FlareDb,
		siteInfo: { name: string; url: string; locale: string },
	) {
		this.plugins = plugins;
		this.db = db;
		this.siteInfo = siteInfo;

		// 1. Collect all hooks from all plugins
		for (const plugin of plugins) {
			for (const [name, hook] of Object.entries(plugin.hooks)) {
				if (!this.hooks[name]) this.hooks[name] = [];
				this.hooks[name].push(hook);
			}
		}

		// 2. Sort hooks by priority (ascending: lower runs first)
		for (const name of Object.keys(this.hooks)) {
			this.hooks[name]?.sort((a, b) => a.priority - b.priority);
		}
	}

	/**
	 * Run a chain of hooks that can modify the event data (Waterfall pattern).
	 * Example: content:beforeSave
	 */
	async runChain<T>(hookName: string, initialData: T): Promise<T> {
		const hooks = this.hooks[hookName];
		if (!hooks || hooks.length === 0) return initialData;

		let currentData = initialData;

		for (const hook of hooks) {
			const ctx = this.createContextForHook(hook);
			currentData = (await this.executeWithTimeout(
				() => hook.handler(currentData, ctx),
				hook.timeout,
				hook.pluginId,
				hookName,
			)) as T;
		}

		return currentData;
	}

	/**
	 * Run all hooks in parallel (Fire-and-forget pattern).
	 * Example: content:afterSave
	 */
	async runParallel(hookName: string, event: unknown): Promise<void> {
		const hooks = this.hooks[hookName];
		if (!hooks || hooks.length === 0) return;

		const promises = hooks.map(async (hook) => {
			const ctx = this.createContextForHook(hook);
			try {
				await this.executeWithTimeout(
					() => hook.handler(event, ctx),
					hook.timeout,
					hook.pluginId,
					hookName,
				);
			} catch (err) {
				console.error(`Hook "${hookName}" failed for plugin "${hook.pluginId}":`, err);
			}
		});

		await Promise.allSettled(promises);
	}

	/**
	 * Run hooks where any hook returning 'false' aborts the operation.
	 * Example: content:beforeDelete
	 */
	async runVeto(hookName: string, event: unknown): Promise<boolean> {
		const hooks = this.hooks[hookName];
		if (!hooks || hooks.length === 0) return true;

		for (const hook of hooks) {
			const ctx = this.createContextForHook(hook);
			const result = await this.executeWithTimeout(
				() => hook.handler(event, ctx),
				hook.timeout,
				hook.pluginId,
				hookName,
			);

			if (result === false) return false;
		}

		return true;
	}

	// ── Content Specific Helpers ──

	async runContentBeforeSave(
		content: Record<string, unknown>,
		collection: string,
		isNew: boolean,
	): Promise<Record<string, unknown>> {
		return this.runChain('content:beforeSave', { content, collection, isNew }).then(
			(res: unknown) => {
				const data = res as { content?: Record<string, unknown> };
				return data.content || (res as Record<string, unknown>);
			},
		);
	}

	async runContentAfterSave(
		content: Record<string, unknown>,
		collection: string,
		isNew: boolean,
	): Promise<void> {
		return this.runParallel('content:afterSave', { content, collection, isNew });
	}

	async runContentBeforeDelete(id: string, collection: string): Promise<boolean> {
		return this.runVeto('content:beforeDelete', { id, collection });
	}

	async runContentAfterDelete(id: string, collection: string): Promise<void> {
		return this.runParallel('content:afterDelete', { id, collection });
	}

	// ── Internal Helpers ──

	private createContextForHook(hook: ResolvedHook): PluginContext {
		const plugin = this.plugins.find((p) => p.id === hook.pluginId);

		return createPluginContext({
			pluginId: hook.pluginId,
			version: plugin?.version || '0.0.0',
			capabilities: plugin?.capabilities || [],
			allowedHosts: plugin?.allowedHosts || [],
			storageCollections: plugin ? Object.keys(plugin.storage) : [],
			db: this.db,
			siteInfo: this.siteInfo,
		});
	}

	private async executeWithTimeout<T>(
		fn: () => Promise<T>,
		timeoutMs: number,
		pluginId: string,
		hookName: string,
	): Promise<T> {
		return Promise.race([
			fn(),
			new Promise<never>((_, reject) =>
				setTimeout(
					() =>
						reject(
							new Error(
								`Hook "${hookName}" from plugin "${pluginId}" timed out after ${timeoutMs}ms`,
							),
						),
					timeoutMs,
				),
			),
		]);
	}
}
