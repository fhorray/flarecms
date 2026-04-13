import type { Block } from '../../client/lib/block-types';

export function renderToBlocks(node: any): Block[] {
  if (node === null || node === undefined) return [];

  if (Array.isArray(node)) {
    return node.flatMap(renderToBlocks);
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return [{ type: 'text', text: String(node) } as any];
  }

  if (typeof node === 'object' && node.type) {
    // If it's a JSX node where type is a functional component
    if (typeof node.type === 'function') {
      return renderToBlocks(node.type(node.props));
    }
  }

  // If it's a direct block object (returned from the type function)
  if (typeof node === 'object' && !node.props && typeof node.type === 'string') {
    const block = { ...node };

    // Some components don't map `blocks` internally and keep children in `buttons` or similar, but our type functions already do the mapping.
    // E.g. `Form` sets `blocks: props.children`.
    // We just need to ensure `blocks` or `buttons` are recursively rendered.

    if (block.blocks) {
      block.blocks = renderToBlocks(block.blocks);
    }

    if (block.buttons) {
      block.buttons = renderToBlocks(block.buttons);
    }

    // 'page' is a virtual block to group things at the root level, but some might use it anywhere. We unwrap it.
    if (block.type === 'page') {
      return block.blocks || [];
    }

    return [block as Block];
  }

  return [];
}
