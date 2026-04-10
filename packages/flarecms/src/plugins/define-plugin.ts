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
export function definePlugin<T extends FlarePluginDefinition>(definition: T): T {
	if (!definition.hooks && !definition.routes && !definition.admin) {
		throw new Error(
			'Invalid plugin definition: A plugin must provide at least `hooks`, `routes`, or an `admin` handler.',
		);
	}

	return definition;
}

export default definePlugin;
