import type {
	FlarePluginDefinition,
	PluginDescriptor,
	ResolvedPlugin,
	FlareHookEntry,
	ResolvedHook,
	FlareRouteEntry,
	ResolvedRoute,
	FlarePlugin,
	FlareActionHandler,
} from './types';

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
 * Adapts any plugin input (Descriptor or full Plugin object) into a ResolvedPlugin.
 */
export function adaptEntry(
	input: PluginDescriptor | FlarePlugin,
): ResolvedPlugin {
	const definition = input as FlarePluginDefinition;
	const descriptor = input as PluginDescriptor;

	const id = descriptor.id;
	const version = descriptor.version;

	const hooks: Record<string, ResolvedHook> = {};
	const routes: Record<string, ResolvedRoute> = {};
	const pages: NonNullable<FlarePluginDefinition['pages']> = [...(definition.pages || [])];
	const actions: Record<string, FlareActionHandler> = { ...(definition.actions || {}) };

	// 1. Process standard hooks
	if (definition.hooks) {
		for (const [name, entry] of Object.entries(definition.hooks)) {
			hooks[name] = resolveHook(entry, id);
		}
	}

	// 2. Process standard routes
	if (definition.routes) {
		for (const [name, entry] of Object.entries(definition.routes)) {
			routes[name] = resolveRoute(entry);
		}
	}

	// 3. Process Features
	if (definition.features) {
		for (const feature of definition.features) {
			// Feature Pages
			if (feature.page) {
				pages.push({
					path: feature.page.path,
					label: feature.page.label || feature.label || feature.id,
					icon: feature.page.icon || feature.icon,
					render: feature.page.render,
				});
			}

			// Feature Actions
			if (feature.actions) {
				for (const [name, handler] of Object.entries(feature.actions)) {
					actions[name] = handler;
				}
			}

			// Feature Hooks
			if (feature.hooks) {
				for (const [name, entry] of Object.entries(feature.hooks)) {
					hooks[name] = resolveHook(entry, id);
				}
			}

			// Feature Routes
			if (feature.routes) {
				for (const [name, entry] of Object.entries(feature.routes)) {
					routes[name] = resolveRoute(entry);
				}
			}
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
		id,
		name: descriptor.name || id,
		version,
		capabilities: descriptor.capabilities || definition.capabilities || [],
		allowedHosts: descriptor.allowedHosts || definition.allowedHosts || [],
		storage,
		hooks,
		routes,
		pages,
		actions,
		adminWidgets: descriptor.adminWidgets ?? [],
	};
}
