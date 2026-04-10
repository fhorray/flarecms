import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card';
import type { CardBlock } from '../../lib/block-types';
import { BlockRenderer } from './block-renderer';

interface BlockCardProps {
  block: CardBlock;
  onAction: (interaction: any) => void;
}

export function BlockCard({ block, onAction }: BlockCardProps) {
  return (
    <Card className={block.className}>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && (
            <CardTitle className="text-lg">{block.title}</CardTitle>
          )}
          {block.description && (
            <CardDescription>{block.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <BlockRenderer blocks={block.blocks} onAction={onAction} />
      </CardContent>
    </Card>
  );
}
