import type { FlarePluginDefinition } from './types.js';

/**
 * definePlugin() Helper
 *
 * Creates a properly typed plugin definition. This is an identity function
 * that provides type inference and basic validation for the standard plugin format.
 *
 * @example
 * ```typescript
 * import { definePlugin } from "flarecms/plugins";
 *
 * export default definePlugin({
 *   hooks: {
 *     "content:afterSave": async (event, ctx) => {
 *       ctx.log.info("Content saved!");
 *     },
 *   },
 * });
 * ```
 */
export function definePlugin(definition: FlarePluginDefinition): FlarePluginDefinition {
	if (!definition.hooks && !definition.routes) {
		throw new Error(
			'Invalid plugin definition: A plugin must provide at least `hooks` or `routes`.',
		);
	}

	return definition;
}

export default definePlugin;
