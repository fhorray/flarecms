import React, { useEffect, useState, useCallback } from 'react';
import { BlockRenderer } from '../components/blocks/block-renderer';
import type {
  Block,
  BlockInteraction,
  BlockResponse,
} from '../lib/block-types';
import { sendPluginInteraction } from '../lib/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

interface PluginPageProps {
  pluginId: string;
  page: string;
}

export function PluginPage({ pluginId, page }: PluginPageProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<BlockResponse['dialog'] | null>(null);

  const handleInteraction = useCallback(
    async (interaction: BlockInteraction) => {
      try {
        const result = (await sendPluginInteraction(pluginId, interaction)) as {
          data: BlockResponse;
        };
        const response = result.data;

        if (response.blocks) {
          setBlocks(response.blocks);
        }

        if (response.dialog) {
          setOverlay(response.dialog);
        } else if (response.blocks || response.redirect) {
          // If we got new blocks or a redirect, close any open overlay
          setOverlay(null);
        }

        if (response.toast) {
          const type = response.toast.type || 'info';
          const toaster = toast as unknown as Record<
            string,
            (msg: string, opts?: any) => void
          >;
          if (typeof toaster[type] === 'function') {
            toaster[type](response.toast.message);
          }
        }

        if (response.redirect) {
          // Simplistic redirect for now - if it starts with /, assume relative to admin base
          if (response.redirect.startsWith('/')) {
             window.location.href = response.redirect;
          }
        }

        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error('Plugin interaction failed:', error);
        setError(error.message || 'Failed to communicate with plugin.');
      } finally {
        setLoading(false);
      }
    },
    [pluginId],
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    handleInteraction({ type: 'page_load', page });
  }, [handleInteraction, page]);

  if (loading && blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="size-8 animate-spin text-primary opacity-40" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          Synchronizing Plugin UI
        </span>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className="p-12 max-w-2xl mx-auto flex flex-col items-center text-center gap-6">
        <div className="size-16 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20 shadow-sm">
          <AlertCircle className="size-8 text-destructive opacity-60" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Plugin Fault Detected
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The plugin "{pluginId}" failed to respond to the integration
            request. Detailed diagnostics:{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {error}
            </code>
          </p>
        </div>
        <button
          onClick={() => handleInteraction({ type: 'page_load', page })}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-md hover:opacity-90 transition-opacity"
        >
          Attempt Re-Sync
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <BlockRenderer blocks={blocks} onAction={handleInteraction} />

      {/* Dialog / Alert Dialog Overlay */}
      <Dialog open={!!overlay && overlay.type !== 'sheet'} onOpenChange={(open) => !open && setOverlay(null)}>
        <DialogContent 
          size={overlay?.size as any}
          showCloseButton={overlay?.type !== 'alert_dialog'}
        >
          <DialogHeader>
            <DialogTitle>{overlay?.title}</DialogTitle>
            {overlay?.description && (
              <DialogDescription>{overlay.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {overlay?.blocks && (
            <div className="py-4">
              <BlockRenderer blocks={overlay.blocks} onAction={handleInteraction} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverlay(null)}>
              {overlay?.cancelText || 'Cancel'}
            </Button>
            {overlay?.onConfirm && (
              <Button 
                onClick={() => {
                  handleInteraction({ type: 'block_action', blockId: overlay.onConfirm! });
                }}
              >
                {overlay?.confirmText || 'Confirm'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet Overlay */}
      <Sheet open={overlay?.type === 'sheet'} onOpenChange={(open) => !open && setOverlay(null)}>
        <SheetContent 
          side={(overlay as any)?.side || "right"} 
          size={(overlay as any)?.size || "default"}
        >
          <SheetHeader>
            <SheetTitle>{overlay?.title}</SheetTitle>
            {overlay?.description && (
              <SheetDescription>{overlay.description}</SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6">
            {overlay?.blocks && (
              <BlockRenderer blocks={overlay.blocks} onAction={handleInteraction} />
            )}
          </div>

          <SheetFooter className="border-t pt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOverlay(null)}>
              {overlay?.cancelText || 'Close'}
            </Button>
            {overlay?.onConfirm && (
              <Button 
                className="w-full sm:w-auto"
                onClick={() => {
                  handleInteraction({ type: 'block_action', blockId: overlay.onConfirm! });
                }}
              >
                {overlay?.confirmText || 'Save Changes'}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
