import { $schema, $activeSlug } from '@/store/schema';
import { FieldModal } from '@/components/field-modal';
import { ContentList } from '@/components/content-list';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  DatabaseIcon,
  Loader2Icon,
  PlusIcon,
  ListIcon,
  Settings2Icon,
  TypeIcon,
  CodeIcon,
  HashIcon,
  CheckIcon,
  CalendarIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CollectionDetailProps {
  id: string;
  slug: string;
  onBack: () => void;
}

export function CollectionDetailPage({
  id,
  slug,
  onBack,
}: CollectionDetailProps) {
  const { data: schema, loading } = useStore($schema);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  useEffect(() => {
    $activeSlug.set(slug);
    return () => $activeSlug.set(null);
  }, [slug]);

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <TypeIcon className="size-3.5" />;
      case 'richtext':
        return <CodeIcon className="size-3.5" />;
      case 'number':
        return <HashIcon className="size-3.5" />;
      case 'boolean':
        return <CheckIcon className="size-3.5" />;
      case 'date':
        return <CalendarIcon className="size-3.5" />;
      default:
        return <DatabaseIcon className="size-3.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-6">
        <Loader2Icon className="size-10 animate-spin text-primary" />
        <p className="font-semibold text-[10px] uppercase tracking-wider">
          Accessing Model...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-container mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="size-9 rounded-md shrink-0 transition-transform active:scale-95"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <Settings2Icon className="size-3" />
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                Structure Engine
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
            className="font-semibold h-9 px-4 text-xs"
          >
            Global Settings
          </Button>
          <Button
            size="sm"
            className="font-semibold h-9 px-6 text-xs"
            onClick={() => setIsFieldModalOpen(true)}
          >
            <PlusIcon className="size-3.5 mr-2" />
            Add Field
          </Button>
        </div>
      </header>

      <Card className="shadow-none border-border overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-4 px-6 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Model Definitions
          </CardTitle>
          <div className="text-[10px] font-mono font-medium text-muted-foreground bg-muted/50 border px-3 py-1 rounded-full">
            REF: {id}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-muted-foreground uppercase text-[10px] font-bold tracking-wider bg-muted/20">
                <TableHead className="w-[40%] pl-6 py-3">Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Endpoint Key</TableHead>
                <TableHead className="text-right pr-6">Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema?.fields?.map((field: any) => (
                <TableRow
                  key={field.id}
                  className="group border-border/50 transition-colors"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="size-9 rounded bg-muted flex items-center justify-center text-muted-foreground/50 group-hover:text-primary transition-colors border">
                        {getFieldIcon(field.type)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-primary group-hover:underline cursor-pointer text-sm leading-none">
                          {field.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                          Field entry
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] font-bold text-foreground/80 capitalize tracking-tight">
                    {field.type}
                  </TableCell>
                  <TableCell className="px-0">
                    <code className="px-2 py-0.5 rounded border bg-muted/50 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      {field.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {field.required && (
                      <div className="inline-flex items-center bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        Required
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!schema?.fields || schema.fields.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-60 text-center text-muted-foreground bg-muted/5"
                  >
                    <DatabaseIcon className="size-12 mx-auto mb-4 opacity-5" />
                    <p className="font-bold text-sm uppercase tracking-wider">
                      Schema Empty
                    </p>
                    <p className="text-[10px] mt-1 font-medium opacity-60 uppercase tracking-widest">
                      Initialize your model by adding the first field
                      definition.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-muted/10 border rounded-lg p-8 border-dashed">
        <h3 className="text-[10px] font-bold text-foreground mb-3 uppercase tracking-[0.2em] opacity-40">
          Core Metadata
        </h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-2xl font-medium">
          These attributes are automatically controlled by the Flare system
          architecture.
        </p>
        <div className="flex flex-wrap gap-2">
          {['id', 'slug', 'status', 'created_at', 'updated_at'].map((f) => (
            <code
              key={f}
              className="px-2.5 py-1 bg-background border text-[10px] font-bold font-mono rounded text-muted-foreground/40 uppercase tracking-tighter"
            >
              {f}
            </code>
          ))}
        </div>
      </div>

      <FieldModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        collectionId={id}
        collectionSlug={slug}
      />
    </div>
  );
}
