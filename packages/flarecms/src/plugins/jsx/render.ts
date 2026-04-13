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

    if (block.type === 'table' && block.rows) {
      block.rows = block.rows.map((row: any) => {
        const newRow: any = {};
        for (const [key, val] of Object.entries(row)) {
          if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            const blocks = renderToBlocks(val);
            newRow[key] = blocks.length === 1 ? blocks[0] : blocks;
          } else {
            newRow[key] = val;
          }
        }
        return newRow;
      });
    }

    if ((block.type === 'accordion' || block.type === 'tabs') && block.items) {
      block.items = block.items.map((item: any) => ({
        ...item,
        blocks: renderToBlocks(item.blocks || item.children) // handle both blocks and children prop just in case
      }));
    }

    if (block.type === 'carousel' && block.items) {
      block.items = block.items.map((slide: any) => renderToBlocks(slide));
    }

    if (block.type === 'item') {
      if (block.media) {
        const mediaBlocks = renderToBlocks(block.media);
        block.media = mediaBlocks[0];
      }
      if (block.actions) {
        block.actions = renderToBlocks(block.actions);
      }
    }

    if ((block.type === 'dialog' || block.type === 'sheet') && block.trigger) {
      if (typeof block.trigger !== 'string') {
        const triggers = renderToBlocks(block.trigger);
        block.trigger = triggers[0] || block.trigger;
      }
    }

    // 'page' is a virtual block to group things at the root level, but some might use it anywhere. We unwrap it.
    if (block.type === 'page') {
      return block.blocks || [];
    }

    return [block as Block];
  }

  return [];
}
