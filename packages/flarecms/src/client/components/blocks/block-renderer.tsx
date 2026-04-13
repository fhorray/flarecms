/** @jsxImportSource react */
import React from 'react';
import type { Block, BlockInteraction, CalendarBlock } from '../../lib/block-types';
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
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { ScrollArea } from '../ui/scroll-area';
import { Calendar } from '../ui/calendar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '../ui/input-otp';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '../ui/item';
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
  if (!blocks) return null;
  const blocksArray = Array.isArray(blocks) ? blocks : [blocks];
  
  return (
    <>
      {blocksArray.map((block, index) => (
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

  // Recursive wrapper for nested renderers (like Table)
  const renderBlock = React.useCallback(
    (b: Block) => <RenderSingleBlock block={b} onAction={onAction} />,
    [onAction],
  );

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
      }[block.variant || ''];
      return (
        <p className={cn('text-sm leading-relaxed', variantClass, className)}>
          {block.text}
        </p>
      );

    case 'divider':
      return <Separator className={cn('my-4', className)} />;

    case 'stat':
      const isPositive = (block.change || 0) > 0;
      const isNegative = (block.change || 0) < 0;
      return (
        <div
          className={cn(
            'p-6 rounded-xl border bg-card text-card-foreground shadow-sm',
            className,
          )}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {block.label}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold tracking-tight">{block.value}</h3>
            {block.change !== undefined && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full',
                  isPositive
                    ? 'text-green-700 bg-green-50'
                    : isNegative
                      ? 'text-red-700 bg-red-50'
                      : 'text-muted-foreground bg-muted',
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-3 mr-1" />
                ) : isNegative ? (
                  <TrendingDown className="size-3 mr-1" />
                ) : null}
                {isPositive ? '+' : ''}
                {block.change}%
              </span>
            )}
          </div>
          {block.changeLabel && (
            <p className="text-xs text-muted-foreground mt-1">
              {block.changeLabel}
            </p>
          )}
        </div>
      );

    case 'input':
      return (
        <div className={cn('space-y-2', className)}>
          {block.label && <Label htmlFor={block.id} className="text-sm font-medium">{block.label}</Label>}
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
        <div className={cn('space-y-2', className)}>
          {block.label && <Label htmlFor={block.id} className="text-sm font-medium">{block.label}</Label>}
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
        <div className={cn('space-y-2', className)}>
          {block.label && <Label className="text-sm font-medium">{block.label}</Label>}
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
        <div className={cn('flex items-center space-x-2', className)}>
          <Switch
            id={block.id}
            defaultChecked={block.value}
            onCheckedChange={(checked) =>
              onAction({ type: 'block_action', blockId: block.id, value: checked })
            }
          />
          {block.label && <Label htmlFor={block.id} className="text-sm">{block.label}</Label>}
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
      return (
        <BlockTable
          block={block}
          onAction={onAction}
          renderBlock={renderBlock}
        />
      );

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

    case 'accordion':
      return (
        <Accordion className={className}>
          {block.items.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger>{item.label}</AccordionTrigger>
              <AccordionContent>
                <BlockRenderer blocks={item.blocks} onAction={onAction} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );

    case 'avatar':
      return (
        <Avatar size={block.size || 'default'} className={className}>
          <AvatarImage src={block.src} />
          <AvatarFallback>{block.fallback}</AvatarFallback>
        </Avatar>
      );

    case 'badge':
      return (
        <Badge variant={block.variant || 'default'} className={className}>
          {block.text}
        </Badge>
      );

    case 'breadcrumb':
      return (
        <Breadcrumb className={className}>
          <BreadcrumbList>
            {block.items.map((item, idx) => (
              <React.Fragment key={idx}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < block.items.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      );

    case 'calendar':
      return (
        <Calendar
          mode={(block.mode as any) || 'single'}
          selected={block.value}
          onSelect={(val) => onAction({ type: 'block_action', blockId: block.id, value: val })}
          className={cn('rounded-md border shadow-sm', className)}
        />
      );

    case 'carousel':
      return (
        <Carousel orientation={block.orientation || 'horizontal'} className={cn('w-full', className)}>
          <CarouselContent>
            {block.items.map((slideBlocks, idx) => (
              <CarouselItem key={idx}>
                <div className="p-1">
                  <BlockRenderer blocks={slideBlocks} onAction={onAction} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );

    case 'checkbox':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Checkbox
            id={block.id}
            checked={block.checked}
            onCheckedChange={(val) => onAction({ type: 'block_action', blockId: block.id, value: val })}
          />
          {block.label && <Label htmlFor={block.id}>{block.label}</Label>}
        </div>
      );

    case 'combobox':
      return (
        <div className={cn('space-y-1.5', className)}>
          {block.label && <Label>{block.label}</Label>}
          <Combobox>
            <ComboboxInput
              placeholder={block.placeholder || 'Search...'}
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>No results found.</ComboboxEmpty>
                {block.options.map((opt) => (
                  <ComboboxItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => onAction({ type: 'block_action', blockId: block.id, value: opt.value })}
                  >
                    {opt.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      );

    case 'dialog':
      return (
        <Dialog>
          <DialogTrigger asChild>
            {typeof block.trigger === 'string' ? (
              <Button variant="outline">{block.trigger}</Button>
            ) : (
              <RenderSingleBlock block={block.trigger} onAction={onAction} />
            )}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              {block.title && <DialogTitle>{block.title}</DialogTitle>}
              {block.description && <DialogDescription>{block.description}</DialogDescription>}
            </DialogHeader>
            <div className="py-4">
              <BlockRenderer blocks={block.blocks} onAction={onAction} />
            </div>
          </DialogContent>
        </Dialog>
      );

    case 'input_otp':
      return (
        <div className={cn('space-y-1.5', className)}>
          <InputOTP
            maxLength={block.length || 6}
            onComplete={(val) => onAction({ type: 'block_action', blockId: block.id, value: val })}
          >
            <InputOTPGroup>
              {Array.from({ length: block.length || 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      );

    case 'item':
      return (
        <Item className={className}>
          {block.media && (
            <ItemMedia>
              <RenderSingleBlock block={block.media} onAction={onAction} />
            </ItemMedia>
          )}
          <ItemContent>
            <ItemTitle>{block.title}</ItemTitle>
            {block.description && <ItemDescription>{block.description}</ItemDescription>}
          </ItemContent>
          {block.actions && (
            <ItemActions>
              <BlockRenderer blocks={block.actions} onAction={onAction} />
            </ItemActions>
          )}
        </Item>
      );

    case 'pagination':
      return (
        <Pagination className={className}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onAction({ type: 'block_action', blockId: block.id, value: block.currentPage - 1 })}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, block.totalPages) }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={block.currentPage === i + 1}
                  onClick={() => onAction({ type: 'block_action', blockId: block.id, value: i + 1 })}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            {block.totalPages > 5 && <PaginationEllipsis />}
            <PaginationItem>
              <PaginationNext
                onClick={() => onAction({ type: 'block_action', blockId: block.id, value: block.currentPage + 1 })}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

    case 'progress':
      return (
        <Progress
          value={block.value}
          max={block.max || 100}
          className={className}
        />
      );

    case 'scroll_area':
      return (
        <ScrollArea
          className={cn('rounded-md border p-4', className)}
          style={{ height: block.height || 200 }}
        >
          <BlockRenderer blocks={block.blocks} onAction={onAction} />
        </ScrollArea>
      );

    case 'sheet':
      return (
        <Sheet>
          <SheetTrigger asChild>
            {typeof block.trigger === 'string' ? (
              <Button variant="outline">{block.trigger}</Button>
            ) : (
              <RenderSingleBlock block={block.trigger} onAction={onAction} />
            )}
          </SheetTrigger>
          <SheetContent side={block.side || 'right'}>
            <SheetHeader>
              {block.title && <SheetTitle>{block.title}</SheetTitle>}
              {block.description && <SheetDescription>{block.description}</SheetDescription>}
            </SheetHeader>
            <div className="py-4">
              <BlockRenderer blocks={block.blocks} onAction={onAction} />
            </div>
          </SheetContent>
        </Sheet>
      );

    case 'slider':
      return (
        <div className={cn('space-y-4 py-2', className)}>
          <Slider
            defaultValue={Array.isArray(block.value) ? block.value : [block.value || 0]}
            min={block.min || 0}
            max={block.max || 100}
            step={block.step || 1}
            onValueChange={(val) => onAction({ type: 'block_action', blockId: block.id, value: val })}
          />
        </div>
      );

    case 'spinner':
      return (
        <div className={cn('flex justify-center p-2', className)}>
          <Spinner size={block.size || 'md'} />
        </div>
      );

    case 'label':
      return <Label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}>{block.text}</Label>;

    case 'tabs':
      return (
        <Tabs defaultValue={block.defaultValue || (block.items[0]?.value)} className={className}>
          <TabsList>
            {block.items.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {block.items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="py-4">
              <BlockRenderer blocks={item.blocks} onAction={onAction} />
            </TabsContent>
          ))}
        </Tabs>
      );

    default:
      return null;

  }
}
