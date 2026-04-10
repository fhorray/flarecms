import React from 'react';
import type { Block, BlockInteraction } from '../../lib/block-types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { BlockCard } from './block-card';
import { BlockForm } from './block-form';
import { BlockTable } from './block-table';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getPluginBlock } from '../../lib/block-registry';

interface BlockRendererProps {
  blocks: Block[];
  onAction: (interaction: BlockInteraction) => void;
}

/**
 * Renders a list of blocks.
 */
export function BlockRenderer({ blocks, onAction }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block, index) => (
        <RenderSingleBlock key={index} block={block} onAction={onAction} />
      ))}
    </>
  );
}

function RenderSingleBlock({
  block,
  onAction,
}: {
  block: Block;
  onAction: (i: BlockInteraction) => void;
}) {
  const className = block.className || '';

  switch (block.type) {
    case 'header':
      const HeaderTag = (
        ['xl', 'lg'].includes(block.size || '') ? 'h2' : 'h3'
      ) as any;
      const sizeClass = {
        xl: 'text-3xl font-bold tracking-tight',
        lg: 'text-2xl font-semibold tracking-tight',
        md: 'text-xl font-medium tracking-tight',
        sm: 'text-lg font-medium',
        xs: 'text-base font-medium',
      }[block.size || 'md'];
      return (
        <HeaderTag className={cn(sizeClass, className)}>{block.text}</HeaderTag>
      );

    case 'text':
      const variantClass = {
        muted: 'text-muted-foreground',
        success: 'text-green-600',
        warning: 'text-amber-600',
        error: 'text-red-600',
        primary: 'text-primary',
      }[block.variant || 'muted'];
      return (
        <p className={cn('text-sm leading-relaxed', variantClass, className)}>
          {block.text}
        </p>
      );

    case 'divider':
      return <Separator className={cn('my-4', className)} />;

    case 'stat':
      return (
        <div
          className={cn(
            'p-4 rounded-lg border bg-card shadow-sm flex flex-col gap-1',
            className,
          )}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            {block.label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tighter">
              {block.value}
            </span>
            {block.change !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-bold flex items-center gap-0.5',
                  block.change > 0 ? 'text-green-500' : 'text-red-500',
                )}
              >
                {block.change > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(block.change)}%
                {block.changeLabel && (
                  <span className="opacity-60 ml-1 font-medium">
                    {block.changeLabel}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      );

    case 'input':
      return (
        <div className={cn('space-y-1.5', className)}>
          {block.label && <Label htmlFor={block.id}>{block.label}</Label>}
          <Input
            id={block.id}
            type={block.inputType || 'text'}
            placeholder={block.placeholder}
            defaultValue={block.value}
            onChange={(e) =>
              onAction({
                type: 'block_action',
                blockId: block.id,
                value: e.target.value,
              })
            }
          />
        </div>
      );

    case 'textarea':
      return (
        <div className={cn('space-y-1.5', className)}>
          {block.label && <Label htmlFor={block.id}>{block.label}</Label>}
          <Textarea
            id={block.id}
            placeholder={block.placeholder}
            defaultValue={block.value}
            rows={block.rows || 3}
            onChange={(e) =>
              onAction({
                type: 'block_action',
                blockId: block.id,
                value: e.target.value,
              })
            }
          />
        </div>
      );

    case 'select':
      return (
        <div className={cn('space-y-1.5', className)}>
          {block.label && <Label>{block.label}</Label>}
          <Select
            defaultValue={block.value}
            onValueChange={(val) =>
              onAction({ type: 'block_action', blockId: block.id, value: val })
            }
          >
            <SelectTrigger id={block.id}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {block.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'toggle':
      return (
        <div className={cn('flex items-center gap-3 py-2', className)}>
          <Switch
            id={block.id}
            defaultChecked={block.value}
            onCheckedChange={(val) =>
              onAction({ type: 'block_action', blockId: block.id, value: val })
            }
          />
          {block.label && <Label htmlFor={block.id}>{block.label}</Label>}
        </div>
      );

    case 'button':
      return (
        <Button
          id={block.id}
          variant={block.variant || 'default'}
          size={block.size || 'default'}
          className={className}
          onClick={() => onAction({ type: 'block_action', blockId: block.id })}
        >
          {block.label}
        </Button>
      );

    case 'button_group':
      return (
        <div
          className={cn(
            'flex flex-wrap gap-2',
            block.align === 'center'
              ? 'justify-center'
              : block.align === 'right'
                ? 'justify-end'
                : 'justify-start',
            className,
          )}
        >
          {block.buttons.map((btn, idx) => (
            <RenderSingleBlock key={idx} block={btn} onAction={onAction} />
          ))}
        </div>
      );

    case 'alert':
      const IconComp = {
        info: Info,
        success: CheckCircle2,
        warning: AlertTriangle,
        destructive: AlertCircle,
      }[block.status];
      const statusClasses = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        destructive: 'bg-red-50 text-red-800 border-red-200',
      }[block.status];

      return (
        <div
          className={cn(
            'p-4 rounded-lg border flex gap-3',
            statusClasses,
            className,
          )}
        >
          <IconComp className="size-5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {block.title && (
              <span className="font-bold text-sm leading-none mb-1">
                {block.title}
              </span>
            )}
            <span className="text-sm leading-relaxed">{block.message}</span>
          </div>
        </div>
      );

    case 'grid':
      return (
        <div
          className={cn('grid gap-4', className)}
          style={{
            gridTemplateColumns: `repeat(${block.columns || 1}, minmax(0, 1fr))`,
            gap: block.gap ? `${block.gap}px` : undefined,
          }}
        >
          <BlockRenderer blocks={block.blocks} onAction={onAction} />
        </div>
      );

    case 'card':
      return <BlockCard block={block} onAction={onAction} />;

    case 'form':
      return <BlockForm block={block} onAction={onAction} />;

    case 'table':
      return <BlockTable block={block} onAction={onAction} />;

    case 'custom':
      const CustomComp = getPluginBlock(block.component);
      if (!CustomComp) {
        return (
          <div className="p-4 border border-dashed border-destructive/50 rounded-lg text-xs text-destructive bg-destructive/5 capitalize font-mono">
            Custom block component "{block.component}" not found
          </div>
        );
      }
      return <CustomComp {...(block.props || {})} onAction={onAction} />;

    default:
      return null;
  }
}
