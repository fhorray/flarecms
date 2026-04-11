import React, { useState } from 'react';
import type { FormBlock, BlockInteraction } from '../../lib/block-types';
import { Button } from '../ui/button';
import { BlockRenderer } from './block-renderer';

interface BlockFormProps {
  block: FormBlock;
  onAction: (interaction: BlockInteraction) => void;
}

export function BlockForm({ block, onAction }: BlockFormProps) {
  // Initialize form data with block values/defaults
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    const collectValues = (blks: any[]) => {
      blks.forEach((b) => {
        if (b.id && b.value !== undefined) initial[b.id] = b.value;
        if (b.id && b.defaultValue !== undefined) initial[b.id] = b.defaultValue;
        if (b.blocks) collectValues(b.blocks);
      });
    };
    if (block.blocks) collectValues(block.blocks);
    return initial;
  });

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAction({
      type: 'form_submit',
      formId: block.id,
      values: formData,
    });
  };

  // We need to pass down the handleChange to input blocks inside the form.
  // One way is to wrap the onAction but that's messy.
  // Better: Use a custom onAction for the internal renderer.
  const handleInternalAction = (action: BlockInteraction) => {
    if (action.type === 'block_action' && action.blockId) {
      handleInputChange(action.blockId, action.value);
    } else {
      // Pass up other actions (like button clicks)
      onAction(action);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${block.className || ''}`}
    >
      <div className="space-y-4">
        <BlockRenderer blocks={block.blocks} onAction={handleInternalAction} />
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full sm:w-auto">
          {block.submitLabel || 'Submit'}
        </Button>
      </div>
    </form>
  );
}
