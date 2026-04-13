import type { Block, BlockResponse } from './types';

export class UIBuilder {
  /**
   * Helper to return a final block response.
   */
  response(opts: Omit<BlockResponse, 'blocks'> & { blocks?: Block[] }): BlockResponse {
    return {
      blocks: opts.blocks,
      toast: opts.toast,
      dialog: opts.dialog,
      redirect: opts.redirect,
    };
  }

  /**
   * Helper to build a standard page response
   */
  page(blocks: Block[]): BlockResponse {
    return { blocks };
  }

  /**
   * Helper to return a redirect response
   */
  redirect(path: string, opts?: { toast?: BlockResponse['toast'] }): BlockResponse {
    return { redirect: path, toast: opts?.toast };
  }

  // --- Block Builders ---

  header(text: string, opts?: { size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; id?: string; variant?: string }): Block {
    return { type: 'header' as const, text, ...opts };
  }

  text(text: string, opts?: { variant?: 'default' | 'muted' | 'success' | 'warning' | 'error' | 'primary'; id?: string; size?: string }): Block {
    return { type: 'text' as const, text, ...opts };
  }

  divider(opts?: { id?: string }): Block {
    return { type: 'divider' as const, ...opts };
  }

  stat(label: string, value: string | number, opts?: { variant?: 'default' | 'outline' | 'accent'; id?: string; size?: string }): Block {
    return { type: 'stat' as const, label, value, ...opts };
  }

  input(id: string, label: string, opts?: { placeholder?: string; defaultValue?: string; required?: boolean; inputType?: string; size?: 'default' | 'sm' | 'lg' }): Block {
    return { type: 'input' as const, id, label, ...opts };
  }

  textarea(id: string, label: string, opts?: { placeholder?: string; defaultValue?: string; required?: boolean; rows?: number; size?: 'default' | 'sm' | 'lg' }): Block {
    return { type: 'textarea' as const, id, label, ...opts };
  }

  select(id: string, label: string, options: Array<{ label: string; value: string }>, opts?: { defaultValue?: string; required?: boolean; size?: 'default' | 'sm' | 'lg' }): Block {
    return { type: 'select' as const, id, label, options, ...opts };
  }

  toggle(id: string, label: string, opts?: { defaultValue?: boolean; size?: 'default' | 'sm' | 'lg' }): Block {
    return { type: 'toggle' as const, id, label, ...opts };
  }

  button(id: string, label: string, opts?: { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'; size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' }): Block {
    return { type: 'button' as const, id, label, ...opts };
  }

  buttonGroup(buttons: Block[], opts?: { id?: string; variant?: 'default' | 'outline' }): Block {
    return { type: 'button_group' as const, buttons, ...opts };
  }

  table(columns: string[], rows: any[][], opts?: { id?: string; variant?: 'default' | 'striped' | 'bordered'; size?: 'sm' | 'default' }): Block {
    const colDefs = columns.map(c => ({ key: c.toLowerCase().replace(/\s+/g, '_'), label: c }));
    const rowDefs = rows.map(r => {
      const rowObj: any = {};
      r.forEach((val, i) => {
        const col = colDefs[i];
        if (col) rowObj[col.key] = val;
      });
      return rowObj;
    });
    return { type: 'table' as const, columns: colDefs, rows: rowDefs, ...opts };
  }

  alert(title: string, message: string, opts?: { status?: 'info' | 'success' | 'warning' | 'error' | 'destructive'; id?: string }): Block {
    return { type: 'alert' as const, title, message, ...opts };
  }

  card(blocks: Block[], opts?: { id?: string; variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'accent' }): Block {
    return { type: 'card' as const, blocks, ...opts };
  }

  grid(columns: number, blocks: Block[], opts?: { id?: string; gap?: number }): Block {
    return { type: 'grid' as const, columns, blocks, ...opts };
  }

  form(id: string, opts: { submitLabel?: string; size?: 'default' | 'sm' | 'lg' }, blocks: Block[]): Block {
    return { type: 'form' as const, id, blocks, ...opts };
  }

  custom(component: string, props: Record<string, any>, opts?: { id?: string }): Block {
    return { type: 'custom' as const, component, props, ...opts };
  }

  emptyState(title: string, description: string, opts?: { action?: Block; id?: string; variant?: string }): Block {
    return { type: 'empty_state' as const, title, description, ...opts };
  }

  // --- Response Modifiers (Dialog, Toast) ---

  toast(type: 'success' | 'error' | 'info' | 'warning', message: string): NonNullable<BlockResponse['toast']> {
    return { type, message };
  }

  dialog(title: string, blocks: Block[], opts?: { confirmText?: string; cancelText?: string; onConfirm?: string; variant?: 'default' | 'destructive'; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' }): NonNullable<BlockResponse['dialog']> {
    return { type: 'dialog', title, blocks, ...opts };
  }

  alertDialog(title: string, opts: { description: string; confirmText?: string; cancelText?: string; onConfirm?: string; variant?: 'destructive' | 'default' }): NonNullable<BlockResponse['dialog']> {
    return { type: 'alert_dialog', title, ...opts };
  }
  
  sheet(title: string, blocks: Block[], opts?: { confirmText?: string; cancelText?: string; onConfirm?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'wide'; side?: 'left' | 'right' | 'top' | 'bottom' }): NonNullable<BlockResponse['dialog']> {
    return { type: 'sheet', title, blocks, ...opts };
  }
}

export const ui = new UIBuilder();
