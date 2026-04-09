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
import { toast } from 'sonner';

export function DocumentDetailPage() {
  const page = useStore($router);
  const { data: schema, loading: schemaLoading } = useStore($schema);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slug = (page as any).params.slug;
  const id = (page as any).params.id;

  useEffect(() => {
    if (slug) {
      $activeSlug.set(slug);
    }
    return () => $activeSlug.set(null);
  }, [slug]);

  const fetchDocument = async () => {
    if (id === 'new') {
      setDocument({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/api/content/${slug}/${id}`);
      if (response.ok) {
        const result = await response.json();
        setDocument(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [slug, id]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const method = id === 'new' ? 'POST' : 'PUT';
      const url =
        id === 'new' ? `/api/content/${slug}` : `/api/content/${slug}/${id}`;

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(id === 'new' ? 'Document deployed' : 'Fragment updated');
        if (id === 'new' && result.data.id) {
          $router.open(`/${slug}/${result.data.id}`);
        } else {
          $router.open(`/${slug}`);
        }
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Verification error encountered');
    } finally {
      setIsSubmitting(false);
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
              Document Processing
            </span>
          </div>
          <h2 className="text-sm font-bold tracking-tight text-foreground leading-none">
            {!id
              ? `New ${schema?.label_singular || 'Document'}`
              : `Edit ${schema?.label_singular || 'Document'}`}
          </h2>
        </div>
      </header>

      <div className="bg-background border rounded-lg p-8 shadow-sm">
        <DynamicForm
          slug={slug}
          initialData={document}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => $router.open(`/${slug}`)}
        />
      </div>
    </div>
  );
}
