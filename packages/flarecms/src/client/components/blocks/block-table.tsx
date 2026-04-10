import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import type { Block, BlockInteraction, TableBlock } from '../../lib/block-types';
import { Button } from '../ui/button';

// Helper to render blocks inside cells without circular imports
function renderCellContent(value: any, onAction: (i: BlockInteraction) => void): React.ReactNode {
  if (!value) return null;
  
  // If it's a block-like object (e.g., button_group or button)
  if (typeof value === 'object' && value !== null && 'type' in value) {
    const block = value as Block;
    
    if (block.type === 'button') {
      return (
        <Button
          key={block.id}
          size="sm"
          variant={(block.variant as any) || 'outline'}
          onClick={() => onAction({ type: 'block_action', blockId: block.id! })}
        >
          {block.label as string}
        </Button>
      );
    }
    
    if (block.type === 'button_group') {
      return (
        <div className="flex items-center gap-2">
          {(block.buttons as any[]).map((btn, idx) => (
            <React.Fragment key={idx}>
              {renderCellContent({ ...btn, type: 'button' }, onAction)}
            </React.Fragment>
          ))}
        </div>
      );
    }

    if (block.type === 'text') {
      return <span className="text-sm">{block.text as string}</span>;
    }
  }

  // Fallback for strings and numbers
  return String(value);
}

interface BlockTableProps {
  block: TableBlock;
  onAction: (interaction: BlockInteraction) => void;
}

export function BlockTable({ block, onAction }: BlockTableProps) {
  return (
    <div className={`rounded-md border ${block.className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {block.columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={block.columns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          ) : (
            block.rows.map((row, i) => (
              <TableRow key={i}>
                {block.columns.map((col) => (
                  <TableCell key={col.key}>
                    {renderCellContent(row[col.key], onAction)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
