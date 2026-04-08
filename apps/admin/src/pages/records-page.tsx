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

export function RecordsPage() {
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
            className="font-semibold h-9 px-6 text-xs"
            onClick={() => $router.open(`/${slug}/new`)}
          >
            <PlusIcon className="size-3.5 mr-2" />
            New Entry
          </Button>
        </div>
      </header>

      <ContentList slug={slug} />
    </div>
  );
}
