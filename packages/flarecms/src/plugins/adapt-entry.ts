import type {
	FlarePluginDefinition,
	PluginDescriptor,
	ResolvedPlugin,
	FlareHookEntry,
	ResolvedHook,
	FlareRouteEntry,
	ResolvedRoute,
} from './types.js';

/**
 * Normalizes a hook entry into a ResolvedHook.
 * Applies default values for priority and timeout.
 */
function resolveHook(hook: FlareHookEntry, pluginId: string): ResolvedHook {
	if (typeof hook === 'function') {
		return {
			priority: 100,
			timeout: 5000,
			handler: hook,
			pluginId,
		};
	}

	return {
		priority: hook.priority ?? 100,
		timeout: hook.timeout ?? 5000,
		handler: hook.handler,
		pluginId,
	};
}

/**
 * Normalizes a route entry into a ResolvedRoute.
 */
function resolveRoute(route: FlareRouteEntry): ResolvedRoute {
	return {
		input: route.input,
		public: route.public ?? false,
		handler: route.handler,
	};
}

/**
 * Adatps a standard plugin definition and descriptor into a ResolvedPlugin.
 * This is used for trusted plugins running in-process.
 */
export function adaptEntry(
	definition: FlarePluginDefinition,
	descriptor: PluginDescriptor,
): ResolvedPlugin {
	const hooks: Record<string, ResolvedHook> = {};
	if (definition.hooks) {
		for (const [name, entry] of Object.entries(definition.hooks)) {
			hooks[name] = resolveHook(entry, descriptor.id);
		}
	}

	const routes: Record<string, ResolvedRoute> = {};
	if (definition.routes) {
		for (const [name, entry] of Object.entries(definition.routes)) {
			routes[name] = resolveRoute(entry);
		}
	}

	const storage: Record<string, { indexes: string[] }> = {};
	if (descriptor.storage) {
		for (const [name, config] of Object.entries(descriptor.storage)) {
			storage[name] = {
				indexes: config.indexes ?? [],
			};
		}
	}

	return {
		id: descriptor.id,
		version: descriptor.version,
		capabilities: descriptor.capabilities ?? [],
		allowedHosts: descriptor.allowedHosts ?? [],
		storage,
		hooks,
		routes,
	};
}
