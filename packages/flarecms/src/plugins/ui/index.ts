import type { Block } from '../../client/lib/block-types';
import { z } from 'zod';

export interface BaseProps {
  id?: string;
  className?: string;
  key?: any;
}

export interface ChildrenProps {
  children?: any;
}

// ── Layout & Display ──

export function Page(props: ChildrenProps) {
  return { type: 'page', blocks: props.children };
}

export function Header(props: BaseProps & ChildrenProps & { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  return { type: 'header', id: props.id, className: props.className, text: props.children, size: props.size };
}

export function Text(props: BaseProps & ChildrenProps & { variant?: 'muted' | 'success' | 'warning' | 'error' | 'primary' }) {
  return { type: 'text', id: props.id, className: props.className, text: props.children, variant: props.variant };
}

export function Divider(props: BaseProps) {
  return { type: 'divider', id: props.id, className: props.className };
}

export function Stat(props: BaseProps & { label: string; value: string | number; change?: number; changeLabel?: string }) {
  return { type: 'stat', id: props.id, className: props.className, label: props.label, value: props.value, change: props.change, changeLabel: props.changeLabel };
}

export function Alert(props: BaseProps & { status: 'info' | 'success' | 'warning' | 'destructive'; title?: string; children?: any }) {
  return { type: 'alert', id: props.id, className: props.className, status: props.status, title: props.title, message: props.children };
}

export function Card(props: BaseProps & ChildrenProps & { title?: string; description?: string }) {
  return { type: 'card', id: props.id, className: props.className, title: props.title, description: props.description, blocks: props.children };
}

export function Grid(props: BaseProps & ChildrenProps & { columns?: number; gap?: number }) {
  return { type: 'grid', id: props.id, className: props.className, columns: props.columns, gap: props.gap, blocks: props.children };
}

export function Table(props: BaseProps & { columns: Array<{ key: string; label: string }>; rows: Array<Record<string, any>> }) {
  return { type: 'table', id: props.id, className: props.className, columns: props.columns, rows: props.rows };
}

export function Accordion(props: BaseProps & { items: Array<{ label: string; children: any }>; type?: 'single' | 'multiple'; collapsible?: boolean }) {
  return { type: 'accordion', id: props.id, className: props.className, items: props.items.map(i => ({ label: i.label, blocks: i.children })), accordionType: props.type, collapsible: props.collapsible };
}

export function Avatar(props: BaseProps & { src?: string; fallback: string; size?: 'sm' | 'default' | 'lg' }) {
  return { type: 'avatar', id: props.id, className: props.className, src: props.src, fallback: props.fallback, size: props.size };
}

export function Badge(props: BaseProps & { variant?: 'default' | 'secondary' | 'destructive' | 'outline'; children: any }) {
  return { type: 'badge', id: props.id, className: props.className, variant: props.variant, text: props.children };
}

export function Breadcrumb(props: BaseProps & { items: Array<{ label: string; href?: string }> }) {
  return { type: 'breadcrumb', id: props.id, className: props.className, items: props.items };
}

export function Progress(props: BaseProps & { value: number; max?: number }) {
  return { type: 'progress', id: props.id, className: props.className, value: props.value, max: props.max };
}

export function ScrollArea(props: BaseProps & ChildrenProps & { height?: string | number }) {
  return { type: 'scroll_area', id: props.id, className: props.className, height: props.height, blocks: props.children };
}

export function Spinner(props: BaseProps & { size?: 'sm' | 'md' | 'lg' }) {
  return { type: 'spinner', id: props.id, className: props.className, size: props.size };
}

export function Label(props: BaseProps & { children: string }) {
  return { type: 'label', id: props.id, className: props.className, text: props.children };
}

export function Tabs(props: BaseProps & { defaultValue?: string; items: Array<{ label: string; value: string; children: any }> }) {
  return { type: 'tabs', id: props.id, className: props.className, defaultValue: props.defaultValue, items: props.items.map(i => ({ label: i.label, value: i.value, blocks: i.children })) };
}

// ── Interactive ──

export function Button(props: BaseProps & ChildrenProps & { variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'; size?: 'default' | 'sm' | 'lg' | 'icon' }) {
  return { type: 'button', id: props.id, className: props.className, label: props.children, variant: props.variant, size: props.size };
}

export function ButtonGroup(props: BaseProps & ChildrenProps & { align?: 'left' | 'center' | 'right' }) {
  return { type: 'button_group', id: props.id, className: props.className, align: props.align, buttons: props.children };
}

export function Carousel(props: BaseProps & { items: any[][]; orientation?: 'horizontal' | 'vertical' }) {
  return { type: 'carousel', id: props.id, className: props.className, items: props.items, orientation: props.orientation };
}

export function Dialog(props: BaseProps & ChildrenProps & { title?: string; description?: string; trigger: any }) {
  return { type: 'dialog', id: props.id, className: props.className, title: props.title, description: props.description, trigger: props.trigger, blocks: props.children };
}

export function Sheet(props: BaseProps & ChildrenProps & { title?: string; description?: string; trigger: any; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return { type: 'sheet', id: props.id, className: props.className, title: props.title, description: props.description, trigger: props.trigger, blocks: props.children, side: props.side };
}

// ── Forms ──

export function Form(props: BaseProps & ChildrenProps & { id?: string; submitLabel?: string; action?: string | Function }) {
  // For now we map action to id to be compatible with BlockInteraction formId if it's a string
  const id = typeof props.action === 'string' ? props.action : props.id;
  return { type: 'form', id, className: props.className, submitLabel: props.submitLabel, blocks: props.children };
}

export function Input(props: BaseProps & { id: string; label?: string; placeholder?: string; value?: string; defaultValue?: string; inputType?: 'text' | 'password' | 'email' | 'number' | 'url'; required?: boolean }) {
  return { type: 'input', id: props.id, className: props.className, label: props.label, placeholder: props.placeholder, value: props.value || props.defaultValue, inputType: props.inputType, required: props.required };
}

export function Textarea(props: BaseProps & { id: string; label?: string; placeholder?: string; value?: string; defaultValue?: string; rows?: number }) {
  return { type: 'textarea', id: props.id, className: props.className, label: props.label, placeholder: props.placeholder, value: props.value || props.defaultValue, rows: props.rows };
}

export function Select(props: BaseProps & { id: string; label?: string; options: Array<{ label: string; value: string }>; value?: string; defaultValue?: string }) {
  return { type: 'select', id: props.id, className: props.className, label: props.label, options: props.options, value: props.value || props.defaultValue };
}

export function Toggle(props: BaseProps & { id: string; label?: string; value?: boolean; defaultValue?: boolean }) {
  return { type: 'toggle', id: props.id, className: props.className, label: props.label, value: props.value ?? props.defaultValue };
}

export function Checkbox(props: BaseProps & { id: string; label?: string; checked?: boolean }) {
  return { type: 'checkbox', id: props.id, className: props.className, label: props.label, checked: props.checked };
}

export function Slider(props: BaseProps & { id: string; min?: number; max?: number; step?: number; value?: number | number[] }) {
  return { type: 'slider', id: props.id, className: props.className, min: props.min, max: props.max, step: props.step, value: props.value };
}

export function InputOTP(props: BaseProps & { id: string; length?: number }) {
  return { type: 'input_otp', id: props.id, className: props.className, length: props.length };
}

export function Combobox(props: BaseProps & { id: string; label?: string; options: Array<{ label: string; value: string }>; placeholder?: string; value?: string }) {
  return { type: 'combobox', id: props.id, className: props.className, label: props.label, options: props.options, placeholder: props.placeholder, value: props.value };
}

export function Calendar(props: BaseProps & { id: string; mode?: 'single' | 'range'; value?: any; defaultValue?: any }) {
  return { type: 'calendar', id: props.id, className: props.className, mode: props.mode, value: props.value || props.defaultValue };
}

export function Pagination(props: BaseProps & { id: string; totalPages: number; currentPage: number }) {
  return { type: 'pagination', id: props.id, className: props.className, totalPages: props.totalPages, currentPage: props.currentPage };
}

// ── Item ──

export function Item(props: BaseProps & { title: string; description?: string; media?: any; actions?: any[] }) {
  return { type: 'item', id: props.id, className: props.className, title: props.title, description: props.description, media: props.media, actions: props.actions };
}

export function Custom(props: BaseProps & { component: string; props?: Record<string, any> }) {
  return { type: 'custom', id: props.id, className: props.className, component: props.component, props: props.props };
}

// ── AutoForm (Zod Schema to Inputs) ──

export function AutoForm<T extends z.ZodRawShape>(props: BaseProps & { id?: string; action?: string | Function; schema: z.ZodObject<T>; submitLabel?: string }) {
  const shape = props.schema.shape;
  const blocks: any[] = [];

  for (const key in shape) {
    const field = shape[key] as any;

    let isOptional = false;

    // Let's use the explicit checks on the _def.type string, which is consistent across zod versions.
    const getType = (f: any): string => f?.def?.type || f?._def?.type || f?.type;
    const unwrapZod = (f: any): any => {
      const t = getType(f);
      if (t === 'optional') {
        isOptional = true;
        return unwrapZod(f._def?.innerType || f.unwrap?.());
      }
      if (t === 'default') {
        isOptional = true; // defaults are optional from input perspective
        return unwrapZod(f._def?.innerType || f.removeDefault?.());
      }
      if (t === 'effects') return unwrapZod(f._def?.schema || f.innerType?.());
      return f;
    };

    const baseField = unwrapZod(field);
    const baseType = getType(baseField);

    let label = key.charAt(0).toUpperCase() + key.slice(1);

    if (baseType === 'string' || baseType === 'ZodString') {
      blocks.push({
        type: 'input',
        id: key,
        label,
        required: !isOptional,
        inputType: 'text'
      });
    } else if (baseType === 'number' || baseType === 'ZodNumber') {
      blocks.push({
        type: 'input',
        id: key,
        label,
        required: !isOptional,
        inputType: 'number'
      });
    } else if (baseType === 'boolean' || baseType === 'ZodBoolean') {
      blocks.push({
        type: 'toggle',
        id: key,
        label,
      });
    } else if (baseType === 'enum' || baseType === 'ZodEnum') {
      // Zod v4 uses values inside _def or def. 
      // Older zods use .options or similar
      const options = baseField.def?.values || baseField._def?.values || baseField.options || [];
      blocks.push({
        type: 'select',
        id: key,
        label,
        options: options.map((opt: string) => ({ label: opt, value: opt }))
      });
    } else {
      // Default fallback for unknown types
      blocks.push({
        type: 'input',
        id: key,
        label,
        required: !isOptional,
        inputType: 'text'
      });
    }
  }

  const id = typeof props.action === 'string' ? props.action : props.id || 'auto-form';

  return { type: 'form', id, className: props.className, submitLabel: props.submitLabel, blocks };
}
