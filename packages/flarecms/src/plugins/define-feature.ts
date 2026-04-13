import type { FlareFeature } from './types';

/**
 * defineFeature() Helper
 * 
 * Creates a properly typed plugin feature definition. This provides
 * type inference for pages, hooks, and actions within a single unit.
 * 
 * @example
 * ```typescript
 * export const MyFeature = defineFeature({
 *   id: 'my-feature',
 *   page: {
 *     path: '/my-feature',
 *     label: 'My Feature',
 *     render: async (ctx) => ui.response({ blocks: [ui.header('Hello')] })
 *   },
 *   actions: {
 *     'my-action': async (interaction, ctx) => { ... }
 *   }
 * });
 * ```
 */
export function defineFeature(feature: FlareFeature): FlareFeature {
  return feature;
}

export default defineFeature;
