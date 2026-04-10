import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $collections } from '../store/collections';
import { $router, navigate } from '../store/router';
import { CollectionModal } from '../components/collection-modal';
import { Button } from '../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import {
  DatabaseIcon,
  PlusIcon,
  Loader2Icon,
  ChevronRightIcon,
  FileTextIcon,
  UploadIcon,
  UserIcon,
  SparklesIcon,
  Puzzle as PuzzleIcon,
} from 'lucide-react';
import { $plugins } from '../store/plugins';
import { PluginWidget } from '../components/plugin-widget';

export function DashboardPage() {
  const { data: collections, loading } = useStore($collections);

  return (
    <div className="p-6 max-w-container mx-auto space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <CollectionModal>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-xs font-semibold"
            >
              <PlusIcon className="size-3.5" />
              Collection
            </Button>
          </CollectionModal>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-xs font-semibold"
          >
            <UploadIcon className="size-3.5" />
            Upload Media
          </Button>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="flex items-center gap-6 px-4 py-2 bg-muted/30 border border-border/50 rounded-md text-[11px] font-medium text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="size-3 text-blue-400" />
          <span>{collections?.length || 0} collections</span>
        </div>
        <div className="flex items-center gap-2 border-l border-border/50 pl-6">
          <UserIcon className="size-3 text-green-400" />
          <span>1 user</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Content */}
        <Card className="py-0 lg:col-span-12 xl:col-span-7 shadow-none border-border overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-4 px-6">
            <CardTitle className="text-sm font-semibold">Content</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {collections?.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => navigate('document_list', { slug: col.slug })}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded bg-muted flex items-center justify-center">
                      {col.slug === 'pages' ? (
                        <FileTextIcon className="size-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      ) : (
                        <DatabaseIcon className="size-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <span className="font-semibold text-foreground/80 group-hover:text-primary transition-colors">
                      {col.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/30">
                    <ChevronRightIcon className="size-4" />
                  </div>
                </div>
              ))}
              {(!collections || collections.length === 0) && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                  <DatabaseIcon className="size-10 mb-4 opacity-10" />
                  <p className="text-sm font-medium">No collections found</p>
                </div>
              )}
            </div>
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2Icon className="size-6 animate-spin text-primary/50" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Activity */}
        <Card className="py-0 lg:col-span-12 xl:col-span-5 shadow-none border-border overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-4 px-6">
            <CardTitle className="text-sm font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-4 text-center">
            <div className="py-20 text-muted-foreground/30">
              <SparklesIcon className="size-8 mx-auto mb-4 opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                System Initialized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugin Widgets Section */}
      <PluginWidgetsSection />
    </div>
  );
}

function PluginWidgetsSection() {
  const { data: plugins } = useStore($plugins);

  const widgets: Array<{
    pluginId: string;
    widgetId: string;
    title?: string;
    size?: string;
  }> = [];

  (plugins || []).forEach((plugin) => {
    if (plugin.adminWidgets) {
      plugin.adminWidgets.forEach((w) => {
        widgets.push({
          pluginId: plugin.id,
          widgetId: w.id,
          title: w.title,
          size: w.size,
        });
      });
    }
  });

  if (widgets.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PuzzleIcon className="size-4 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">
          Plugin Extension Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {widgets.map((w) => (
          <Card
            key={`${w.pluginId}-${w.widgetId}`}
            className={cn(
              'shadow-none border-border overflow-hidden',
              w.size === 'full'
                ? 'md:col-span-2 xl:col-span-3'
                : w.size === 'half'
                  ? 'xl:col-span-2'
                  : '',
            )}
          >
            <CardHeader className="bg-muted/10 border-b py-3 px-5">
              <CardTitle className="text-[10px] items-center flex gap-2 font-bold uppercase tracking-widest text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {w.title || w.widgetId}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <PluginWidget pluginId={w.pluginId} widgetId={w.widgetId} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper for conditional classes if not already imported from a util
function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}
