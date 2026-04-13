import { renderToBlocks } from './jsx/render';
import type { PluginContext, BlockInteraction, BlockResponse } from './types';

export type PageHandler = (interaction: BlockInteraction, ctx: PluginContext) => Promise<any> | any;

/**
 * Wraps a JSX-returning function to be used as an `admin.handler`.
 * It automatically calls `renderToBlocks` on the JSX output.
 */
export function definePage(handler: PageHandler) {
  return async (interaction: BlockInteraction, ctx: PluginContext): Promise<BlockResponse> => {
    const result = await handler(interaction, ctx);

    // If the result already looks like a BlockResponse (e.g. contains blocks or toast and is not a JSX element)
    // JSX elements typically have a `type` property and `props`.
    if (result && typeof result === 'object' && !result.props && !result.type && (result.blocks || result.toast)) {
      return {
        ...result,
        blocks: result.blocks ? renderToBlocks(result.blocks) as any : []
      };
    }

    // Otherwise, assume the entire result is a JSX tree (or an array of blocks)
    return {
      blocks: renderToBlocks(result) as any
    };
  };
}
