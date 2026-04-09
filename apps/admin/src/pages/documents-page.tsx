import { useStore } from '@nanostores/react';
import { $schema, $activeSlug } from '@/store/schema';
import { $router } from '@/store/router';
import { useEffect } from 'react';
import { ContentList } from '@/components/content-list';
import {
  Database as DatabaseIcon,
  Plus as PlusIcon,
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocumentsPage() {
  const page = useStore($router);
  const { data: schema, loading } = useStore($schema);
  const slug = (page as any).params.slug;

  useEffect(() => {
    if (slug) {
      $activeSlug.set(slug);
    }
    return () => $activeSlug.set(null);
  }, [slug]);

  if (loading) return null;

  const hasFields = schema?.fields && schema.fields.length > 0;

  return (
    <div className="p-6 max-w-container mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DatabaseIcon className="size-4" />
            <ChevronRightIcon className="size-3 opacity-30" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                Collection Registry
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {schema?.label || slug}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-semibold h-9 px-4 text-xs gap-2"
            onClick={() => $router.open(`/collection/${schema?.id}/${slug}`)}
          >
            <SettingsIcon className="size-3.5" />
            Config
          </Button>
          <Button
            size="sm"
            disabled={!hasFields}
            className="font-bold h-9 px-6 text-xs gap-2 shadow-sm"
            onClick={() => $router.open(`/${slug}/new`)}
          >
            <PlusIcon className="size-3.5" />
            New Document
          </Button>
        </div>
      </header>

      {!hasFields && (
        <div className="p-8 border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                 <SettingsIcon className="size-6" />
              </div>
              <div className="flex-1 space-y-1">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Immutable Data Structure</h3>
                 <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    This collection is currently defined with zero fields. In order to begin populating data, you must first initialize your schema definitions in the structural configuration panel.
                 </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-6 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => $router.open(`/collection/${schema?.id}/${slug}`)}
              >
                Launch Builder
              </Button>
           </div>
        </div>
      )}

      <ContentList slug={slug} />
    </div>
  );
}
