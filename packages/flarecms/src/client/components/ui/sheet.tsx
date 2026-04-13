'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { clsx } from 'clsx';
import { Button } from './button';
import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 h-auto border-b data-ending-style:translate-y-[-2.5rem] data-starting-style:translate-y-[-2.5rem]',
        bottom: 'inset-x-0 bottom-0 h-auto border-t data-ending-style:translate-y-[2.5rem] data-starting-style:translate-y-[2.5rem]',
        left: 'inset-y-0 left-0 h-full border-r data-ending-style:translate-x-[-2.5rem] data-starting-style:translate-x-[-2.5rem]',
        right: 'inset-y-0 right-0 h-full border-l data-ending-style:translate-x-[2.5rem] data-starting-style:translate-x-[2.5rem]',
      },
      size: {
        default: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
        full: '',
        wide: '',
      },
    },
    compoundVariants: [
      { side: ['left', 'right'], size: 'default', className: 'w-3/4 sm:max-w-sm' },
      { side: ['left', 'right'], size: 'sm', className: 'w-1/4 sm:max-w-xs' },
      { side: ['left', 'right'], size: 'md', className: 'w-1/2 sm:max-w-md' },
      { side: ['left', 'right'], size: 'lg', className: 'w-3/4 sm:max-w-lg' },
      { side: ['left', 'right'], size: 'xl', className: 'w-5/6 sm:max-w-xl' },
      { side: ['left', 'right'], size: 'full', className: 'w-full' },
      { side: ['left', 'right'], size: 'wide', className: 'w-[90vw]' },
      { side: ['top', 'bottom'], size: 'sm', className: 'h-1/4' },
      { side: ['top', 'bottom'], size: 'md', className: 'h-1/2' },
      { side: ['top', 'bottom'], size: 'lg', className: 'h-3/4' },
      { side: ['top', 'bottom'], size: 'full', className: 'h-full' },
    ],
    defaultVariants: {
      side: 'right',
      size: 'default',
    },
  }
);

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ children, ...props }: SheetPrimitive.Portal.Props) {
  return (
    <SheetPrimitive.Portal data-slot="sheet-portal" {...props}>
      <div className="flare-admin text-foreground">{children}</div>
    </SheetPrimitive.Portal>
  );
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  size = 'default',
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & VariantProps<typeof sheetVariants> & {
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side, size }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-0.5 p-4', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'font-heading text-base font-medium text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
