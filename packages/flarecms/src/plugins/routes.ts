import type { ResolvedPlugin, ResolvedRoute, RouteCtx, SerializedRequest } from './types.js';
import { createPluginContext } from './context.js';
import type { FlareDb } from '../db/index.js';

export interface InvokeRouteOptions {
	input: unknown;
	request: SerializedRequest;
}

/**
 * PluginRouteRegistry manages custom HTTP routes exposed by plugins.
 */
export class PluginRouteRegistry {
	private routes: Map<string, Record<string, ResolvedRoute>> = new Map();
	private db: FlareDb;
	private siteInfo: { name: string; url: string; locale: string };

	constructor(db: FlareDb, siteInfo: { name: string; url: string; locale: string }) {
		this.db = db;
		this.siteInfo = siteInfo;
	}

	/**
	 * Registers all routes for a given plugin.
	 */
	register(plugin: ResolvedPlugin): void {
		this.routes.set(plugin.id, plugin.routes);
	}

	/**
	 * Invokes a specific plugin route.
	 */
	async invoke(
		pluginId: string,
		routeName: string,
		options: InvokeRouteOptions,
	): Promise<unknown> {
		const pluginRoutes = this.routes.get(pluginId);
		if (!pluginRoutes) {
			throw new Error(`Plugin "${pluginId}" not found or has no routes registered.`);
		}

		const route = pluginRoutes[routeName];
		if (!route) {
			throw new Error(`Route "${routeName}" not found in plugin "${pluginId}".`);
		}

		// TODO: Implement input validation using route.input (Zod) if provided

		const ctx = createPluginContext({
			pluginId,
			version: '0.0.0', // TODO: Lookup from registry
			capabilities: [
				'read:content',
				'write:content',
				'read:media',
				'write:media',
				'network:fetch',
				'read:users',
			], // Defaulting to full for in-process
			allowedHosts: [],
			storageCollections: [],
			db: this.db,
			siteInfo: this.siteInfo,
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
		const pluginRoutes = this.routes.get(pluginId);
		return pluginRoutes ? Object.keys(pluginRoutes) : [];
	}
}
