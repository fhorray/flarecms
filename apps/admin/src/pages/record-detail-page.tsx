import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $schema, $activeSlug } from '@/store/schema';
import { $router } from '@/store/router';
import { apiFetch } from '@/lib/api';
import { DynamicForm } from '@/components/dynamic-form';
import {
  ArrowLeft as ArrowLeftIcon,
  Database as DatabaseIcon,
  Loader2 as Loader2Icon,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RecordDetailPage() {
  const page = useStore($router);
  const { data: schema, loading: schemaLoading } = useStore($schema);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const slug = (page as any).params.slug;
  const id = (page as any).params.id;

  useEffect(() => {
    if (slug) {
      $activeSlug.set(slug);
    }
    return () => $activeSlug.set(null);
  }, [slug]);

  const fetchRecord = async () => {
    if (id === 'new') {
      setRecord({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/content/${slug}/${id}`);
      const json = await response.json();
      setRecord(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [slug, id]);

  const handleSubmit = async (data: any) => {
    try {
      const method = id === 'new' ? 'POST' : 'PUT';
      const url =
        id === 'new' ? `/api/content/${slug}` : `/api/content/${slug}/${id}`;

      await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });

      $router.open(`/${slug}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (schemaLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-6">
        <Loader2Icon className="size-10 animate-spin text-primary" />
        <p className="font-semibold text-[10px] uppercase tracking-wider">
          Initializing Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-container mx-auto space-y-8">
      <header className="flex items-center gap-4 px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => $router.open(`/${slug}`)}
          className="size-9 rounded-md shrink-0 transition-transform active:scale-95"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <SparklesIcon className="size-3" />
            <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
              Node Processing
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
            {id === 'new'
              ? `New ${schema?.labelSingular || 'Entry'}`
              : `Edit ${schema?.labelSingular || 'Entry'}`}
          </h1>
        </div>
      </header>

      <div className="bg-background border rounded-lg p-8 shadow-sm">
        <DynamicForm
          slug={slug}
          initialData={record}
          onSubmit={handleSubmit}
          onCancel={() => $router.open(`/${slug}`)}
        />
      </div>

      <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
        <DatabaseIcon className="size-3" />
        <span>Flare Persistence Layer v2</span>
      </div>
    </div>
  );
}
