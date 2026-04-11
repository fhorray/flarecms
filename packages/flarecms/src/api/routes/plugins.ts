import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import { apiResponse } from '../lib/response';
import type { SerializedRequest } from '../../plugins/types';

export const pluginRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/plugins
 * Returns a list of all active plugins and their metadata.
 */
pluginRoutes.get('/', async (c) => {
	const manager = c.get('pluginManager' as any);
	if (!manager) return apiResponse.error(c, 'Plugin system not initialized');

	const plugins = manager.getActivePlugins();
	return apiResponse.ok(
		c,
		plugins.map((p: any) => ({
			id: p.id,
			name: p.name,
			version: p.version,
			capabilities: p.capabilities,
			routes: manager.getRoutes?.(p.id) ?? [],
			adminPages: p.adminPages ?? [],
			adminWidgets: p.adminWidgets ?? [],
		})),
	);
});

/**
 * POST /api/plugins/:id/admin
 * Handles administrative UI interactions via Block Kit.
 */
pluginRoutes.post('/:id/admin', async (c) => {
	const manager = c.get('pluginManager' as any);
	if (!manager) return apiResponse.error(c, 'Plugin system not initialized');

	const pluginId = c.req.param('id');
	const interaction = await c.req.json().catch(() => ({}));

	try {
		const result = await manager.invokeAdmin(pluginId, interaction);
		return apiResponse.ok(c, result);
	} catch (err: any) {
		return apiResponse.error(c, err.message, 400);
	}
});

/**
 * POST /api/plugins/:id/routes/:name
 * Invokes a specific custom route exposed by a plugin.
 */
pluginRoutes.post('/:id/routes/:name', async (c) => {
	const manager = c.get('pluginManager');
	if (!manager) return apiResponse.error(c, 'Plugin system not initialized');

	const pluginId = c.req.param('id');
	const routeName = c.req.param('name');
	const input = await c.req.json().catch(() => ({}));

	// Serialize the current request for the plugin
	const serializedReq: SerializedRequest = {
		url: c.req.url,
		method: c.req.method,
		headers: Object.fromEntries(c.req.raw.headers.entries()),
		meta: {
			ip: c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || null,
			userAgent: c.req.header('user-agent') || null,
			referer: c.req.header('referer') || null,
		},
	};

	try {
		const result = await manager.invokeRoute(pluginId, routeName, {
			input,
			request: serializedReq,
		});

		return apiResponse.ok(c, result);
	} catch (err: any) {
		return apiResponse.error(c, err.message, 400);
	}
});
