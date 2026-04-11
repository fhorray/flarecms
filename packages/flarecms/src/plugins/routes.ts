import type { ResolvedPlugin, ResolvedRoute, RouteCtx, SerializedRequest } from './types';
import { createPluginContext } from './context';
import type { FlareDb } from '../db/index';

export interface InvokeRouteOptions {
	input: unknown;
	request: SerializedRequest;
}

/**
 * PluginRouteRegistry manages custom HTTP routes exposed by plugins.
 */
export class PluginRouteRegistry {
	private plugins: Map<string, ResolvedPlugin> = new Map();
	private db: FlareDb;
	private siteInfo: { name: string; url: string; locale: string };
	private encryptionSecret?: string;

	constructor(db: FlareDb, siteInfo: { name: string; url: string; locale: string }, encryptionSecret?: string) {
		this.db = db;
		this.siteInfo = siteInfo;
		this.encryptionSecret = encryptionSecret;
	}

	/**
	 * Registers all routes for a given plugin.
	 */
	register(plugin: ResolvedPlugin): void {
		this.plugins.set(plugin.id, plugin);
	}

	/**
	 * Invokes a specific plugin route.
	 */
	async invoke(
		pluginId: string,
		routeName: string,
		options: InvokeRouteOptions,
	): Promise<unknown> {
		const plugin = this.plugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin "${pluginId}" not found or has no routes registered.`);
		}

		const route = plugin.routes[routeName];
		if (!route) {
			throw new Error(`Route "${routeName}" not found in plugin "${pluginId}".`);
		}

		// TODO: Implement input validation using route.input (Zod) if provided

		const ctx = createPluginContext({
			pluginId,
			version: plugin.version,
			capabilities: plugin.capabilities,
			allowedHosts: plugin.allowedHosts,
			storageCollections: Object.keys(plugin.storage),
			db: this.db,
			siteInfo: this.siteInfo,
			encryptionSecret: this.encryptionSecret,
		});

		const routeCtx: RouteCtx = {
			input: options.input,
			request: options.request,
			requestMeta: options.request.meta,
		};

		return await route.handler(routeCtx, ctx);
	}

	/**
	 * Gets all registered routes for a specific plugin.
	 */
	getRoutes(pluginId: string): string[] {
		const plugin = this.plugins.get(pluginId);
		return plugin ? Object.keys(plugin.routes) : [];
	}
}
