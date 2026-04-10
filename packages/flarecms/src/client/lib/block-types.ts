/**
 * Block Kit Type System
 * 
 * A declarative UI definition system for sandboxed plugins.
 */

export type BlockType =
  | 'header'
  | 'text'
  | 'divider'
  | 'stat'
  | 'input'
  | 'textarea'
  | 'select'
  | 'toggle'
  | 'button'
  | 'button_group'
  | 'table'
  | 'alert'
  | 'card'
  | 'grid'
  | 'form'
  | 'custom';

export interface BaseBlock {
  type: BlockType;
  id?: string;
  className?: string;
}

export interface HeaderBlock extends BaseBlock {
  type: 'header';
  text: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  text: string;
  variant?: 'muted' | 'success' | 'warning' | 'error' | 'primary';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface StatBlock extends BaseBlock {
  type: 'stat';
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

export interface InputBlock extends BaseBlock {
  type: 'input';
  id: string; // Required for forms
  label?: string;
  placeholder?: string;
  value?: string;
  inputType?: 'text' | 'password' | 'email' | 'number' | 'url';
}

export interface TextareaBlock extends BaseBlock {
  type: 'textarea';
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
}

export interface SelectBlock extends BaseBlock {
  type: 'select';
  id: string;
  label?: string;
  options: Array<{ label: string; value: string }>;
  value?: string;
}

export interface ToggleBlock extends BaseBlock {
  type: 'toggle';
  id: string;
  label?: string;
  value?: boolean;
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  id: string;
  label: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export interface ButtonGroupBlock extends BaseBlock {
  type: 'button_group';
  buttons: ButtonBlock[];
  align?: 'left' | 'center' | 'right';
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, any>>;
}

export interface AlertBlock extends BaseBlock {
  type: 'alert';
  title?: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'destructive';
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  title?: string;
  description?: string;
  blocks: Block[];
}

export interface GridBlock extends BaseBlock {
  type: 'grid';
  columns?: number;
  gap?: number;
  blocks: Block[];
}

export interface FormBlock extends BaseBlock {
  type: 'form';
  id: string;
  submitLabel?: string;
  blocks: Block[];
}

export interface CustomBlock extends BaseBlock {
  type: 'custom';
  component: string;
  props?: Record<string, any>;
}

export type Block =
  | HeaderBlock
  | TextBlock
  | DividerBlock
  | StatBlock
  | InputBlock
  | TextareaBlock
  | SelectBlock
  | ToggleBlock
  | ButtonBlock
  | ButtonGroupBlock
  | TableBlock
  | AlertBlock
  | CardBlock
  | GridBlock
  | FormBlock
  | CustomBlock;

// --- Interactions ---

export type BlockInteraction =
  | { type: 'page_load'; page: string }
  | { type: 'block_action'; blockId: string; value?: any }
  | { type: 'form_submit'; formId: string; values: Record<string, any> };

export interface BlockResponse {
  blocks: Block[];
  toast?: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  };
}
