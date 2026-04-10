import React, { useEffect, useState, useCallback } from 'react';
import { BlockRenderer } from './blocks/block-renderer';
import type {
  Block,
  BlockInteraction,
  BlockResponse,
} from '../lib/block-types';
import { sendPluginInteraction } from '../lib/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PluginWidgetProps {
  pluginId: string;
  widgetId: string;
}

export function PluginWidget({ pluginId, widgetId }: PluginWidgetProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleInteraction = useCallback(
    async (interaction: BlockInteraction) => {
      try {
        const result = (await sendPluginInteraction(
          pluginId,
          interaction,
        )) as { data: BlockResponse };
        const response = result.data;

        if (response.blocks) {
          setBlocks(response.blocks);
        }

        if (response.toast) {
          const type = response.toast.type || 'info';
          const toaster = toast as unknown as Record<
            string,
            (msg: string) => void
          >;
          if (typeof toaster[type] === 'function') {
            toaster[type](response.toast.message);
          }
        }

        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Widget fault');
      } finally {
        setLoading(false);
      }
    },
    [pluginId],
  );

  useEffect(() => {
    handleInteraction({ type: 'page_load', page: `__widget__/${widgetId}` });
  }, [handleInteraction, widgetId]);

  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground opacity-20" />
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 text-[10px] uppercase font-bold tracking-wider text-destructive bg-destructive/5 rounded-lg border border-destructive/10">
        <AlertTriangle className="size-3.5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BlockRenderer blocks={blocks} onAction={handleInteraction} />
    </div>
  );
}
