import { createPluginContext } from './context.js';
import { HookPipeline } from './hooks.js';
import { PluginRouteRegistry, type InvokeRouteOptions } from './routes.js';
import type { ResolvedPlugin, BlockInteraction, BlockResponse } from './types.js';
import type { FlareDb } from '../db/index.js';

/**
 * PluginManager is the central orchestrator for the FlareCMS plugin system.
 * It coordinates hook execution, route handling, and plugin lifecycle.
 */
export class PluginManager {
	private hookPipeline: HookPipeline;
	private routeRegistry: PluginRouteRegistry;

	constructor(
		public plugins: ResolvedPlugin[],
		public db: FlareDb,
		public siteInfo: { name: string; url: string; locale: string },
		public encryptionSecret?: string
	) {
		// Initialize sub-systems
		this.hookPipeline = new HookPipeline(plugins, db, siteInfo);
		this.routeRegistry = new PluginRouteRegistry(db, siteInfo, encryptionSecret);

		// Register all plugin routes
		for (const plugin of plugins) {
			this.routeRegistry.register(plugin);
		}
	}

	// ── Hook Accessors ──

	async runContentBeforeSave(
		content: Record<string, unknown>,
		collection: string,
		isNew: boolean,
	): Promise<Record<string, unknown>> {
		return this.hookPipeline.runContentBeforeSave(content, collection, isNew);
	}

	async runContentAfterSave(
		content: Record<string, unknown>,
		collection: string,
		isNew: boolean,
	): Promise<void> {
		return this.hookPipeline.runContentAfterSave(content, collection, isNew);
	}

	async runContentBeforeDelete(id: string, collection: string): Promise<boolean> {
		return this.hookPipeline.runContentBeforeDelete(id, collection);
	}

	async runContentAfterDelete(id: string, collection: string): Promise<void> {
		return this.hookPipeline.runContentAfterDelete(id, collection);
	}

	// ── Route Accessors ──

	async invokeRoute(pluginId: string, routeName: string, options: InvokeRouteOptions): Promise<unknown> {
		return this.routeRegistry.invoke(pluginId, routeName, options);
	}

	/**
	 * Invokes the administrative UI handler for a plugin.
	 */
	async invokeAdmin(pluginId: string, interaction: BlockInteraction): Promise<BlockResponse> {
		const plugin = this.plugins.find((p) => p.id === pluginId);
		if (!plugin) throw new Error(`Plugin "${pluginId}" not found.`);
		if (!plugin.admin) throw new Error(`Plugin "${pluginId}" does not support admin interactions.`);

		const ctx = createPluginContext({
			pluginId: plugin.id,
			version: plugin.version,
			capabilities: plugin.capabilities,
			allowedHosts: plugin.allowedHosts,
			storageCollections: Object.keys(plugin.storage),
			db: this.db,
			siteInfo: this.siteInfo,
			encryptionSecret: this.encryptionSecret,
		});

		return plugin.admin.handler(interaction, ctx);
	}

	/**
	 * Returns the list of active plugins and their basic info.
	 */
	getActivePlugins(): ResolvedPlugin[] {
		return this.plugins;
	}

	/**
	 * Checks if a specific plugin is loaded and active.
	 */
	isActive(pluginId: string): boolean {
		return this.plugins.some((p) => p.id === pluginId);
	}
}
