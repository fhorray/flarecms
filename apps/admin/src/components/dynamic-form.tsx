import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $schema } from '../store/schema';
import { Loader2Icon, CheckIcon, TypeIcon } from 'lucide-react';
import type { Field } from '../types';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  slug: string;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  initialData?: Record<string, any> | null;
  isSubmitting?: boolean;
}

export function DynamicForm({
  slug,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: DynamicFormProps) {
  const { data: schema, loading } = useStore($schema);
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData || {},
  );

  if (loading)
    return (
      <div className="flex flex-col items-center gap-4 py-20 justify-center text-muted-foreground">
        <Loader2Icon className="size-8 animate-spin text-primary/40" />
        <p className="text-[10px] font-bold uppercase tracking-widest">
          Acquiring Structure...
        </p>
      </div>
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit(formData);
  };

  const renderField = (field: Field) => {
    const value = formData[field.slug] ?? '';
    const onChange = (val: any) =>
      setFormData({ ...formData, [field.slug]: val });

    switch (field.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-4 cursor-pointer p-5 bg-muted/20 rounded-md border border-border/50 hover:bg-muted/30 transition-all border-dashed group opacity-100 disabled:opacity-50">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={!!value}
                disabled={isSubmitting}
                onChange={(e) => onChange(e.target.checked)}
              />
              <div className="w-10 h-5 bg-muted-foreground/20 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:after:translate-x-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                {field.label}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider opacity-60">
                Binary State Toggle
              </span>
            </div>
          </label>
        );

      case 'richtext':
        return (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {field.label}
            </label>
            <textarea
              className="w-full bg-muted/20 border border-border rounded-md px-4 py-3 text-sm focus:bg-background transition-all min-h-[180px] outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              value={value}
              disabled={isSubmitting}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter content for ${field.label.toLowerCase()}...`}
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {field.label}
            </label>
            <input
              type="number"
              className="w-full h-10 bg-muted/20 border border-border rounded-md px-4 text-sm focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              value={value}
              disabled={isSubmitting}
              onChange={(e) => onChange(Number(e.target.value))}
            />
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {field.label}
            </label>
            <input
              type="date"
              className="w-full h-10 bg-muted/20 border border-border rounded-md px-4 text-sm focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              value={value}
              disabled={isSubmitting}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
              {field.label}
            </label>
            <input
              type="text"
              className="w-full h-10 bg-muted/20 border border-border rounded-md px-4 text-sm focus:bg-background transition-all outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              value={value}
              disabled={isSubmitting}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <fieldset disabled={isSubmitting} className="space-y-8 contents">
        {schema?.fields?.map((field: Field) => (
          <div key={field.id}>{renderField(field)}</div>
        ))}
        {(!schema?.fields || schema.fields.length === 0) && (
          <div className="p-12 text-center bg-muted/10 rounded-lg border border-dashed flex flex-col items-center gap-4">
            <TypeIcon className="size-8 opacity-10" />
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-wider text-foreground/50">
                Model Void
              </p>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest opacity-40">
                Define fields in the structure engine to begin entry
              </p>
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex justify-end gap-3 pt-8 border-t border-dashed">
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting}
          onClick={onCancel}
          className="text-xs font-semibold h-10 px-6 text-muted-foreground hover:text-foreground"
        >
          Discard Changes
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="font-bold h-10 px-8 text-xs tracking-tight min-w-32"
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 mr-2 animate-spin" />
          ) : (
            <CheckIcon className="size-4 mr-2" />
          )}
          {isSubmitting
            ? 'Processing...'
            : initialData?.id
              ? 'Update Document'
              : 'Create Document'}
        </Button>
      </div>
    </form>
  );
}
