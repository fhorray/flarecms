import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  PlusIcon,
  Loader2Icon,
  TypeIcon,
  HashIcon,
  CheckSquareIcon,
  CalendarIcon,
  AlignLeftIcon,
} from 'lucide-react';
import { $addField } from '../store/schema';
import type { Field } from '../types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FieldModalProps {
  children: React.ReactElement;
  collectionId: string;
  collectionSlug: string;
}

const FIELD_TYPES = [
  { id: 'text', label: 'Plain Text', icon: <TypeIcon className="w-4 h-4" /> },
  {
    id: 'richtext',
    label: 'Rich Text',
    icon: <AlignLeftIcon className="w-4 h-4" />,
  },
  { id: 'number', label: 'Number', icon: <HashIcon className="w-4 h-4" /> },
  {
    id: 'boolean',
    label: 'Boolean',
    icon: <CheckSquareIcon className="w-4 h-4" />,
  },
  { id: 'date', label: 'Date', icon: <CalendarIcon className="w-4 h-4" /> },
] as const;

export function FieldModal({
  children,
  collectionId,
  collectionSlug,
}: FieldModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Field>>({
    label: '',
    slug: '',
    type: 'text',
    required: false,
  });

  const { mutate, loading } = useStore($addField);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutate({
        ...formData,
        collectionId,
        collectionSlug,
      });
      setIsOpen(false);
      setFormData({ label: '', slug: '', type: 'text', required: false });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-border bg-background rounded-md shadow-lg">
        <DialogHeader className="px-8 py-8 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-background border rounded-md shadow-sm">
              <PlusIcon className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                New Structure Field
              </DialogTitle>
              <DialogDescription className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                Define Attribute Parameter
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  Field Label
                </Label>
                <Input
                  required
                  placeholder="e.g. Featured Toggle"
                  className="h-10 bg-muted/20 focus:bg-background transition-all border-border rounded-md px-4 text-sm font-medium"
                  value={formData.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const slug = label
                      .toLowerCase()
                      .replace(/\s+/g, '_')
                      .replace(/[^a-z0-9_]/g, '');
                    setFormData({ ...formData, label, slug });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  Database Key
                </Label>
                <Input
                  required
                  className="h-10 bg-muted/20 focus:bg-background transition-all border-border rounded-md font-mono text-[11px] font-semibold text-muted-foreground"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                Field Type
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: type.id as any })
                    }
                    className={`flex items-center gap-3 p-3.5 rounded-md border transition-all text-left group ${
                      formData.type === type.id
                        ? 'bg-primary/5 border-primary text-primary font-bold shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                    }`}
                  >
                    <div
                      className={
                        formData.type === type.id
                          ? 'text-primary'
                          : 'text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors'
                      }
                    >
                      {type.icon}
                    </div>
                    <span className="text-[11px] uppercase tracking-tight leading-none font-semibold">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-4 cursor-pointer group p-5 bg-muted/20 border border-border/50 rounded-md hover:bg-muted/30 transition-all border-dashed">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.required}
                  onChange={(e) =>
                    setFormData({ ...formData, required: e.target.checked })
                  }
                />
                <div className="w-10 h-5 bg-muted-foreground/20 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform peer-checked:after:translate-x-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">
                  Required Property
                </p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                  Enforce data integrity
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="bg-muted/10 border-t p-6 px-8 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground h-10 px-6"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-bold px-8 rounded-md h-10 text-xs tracking-tight"
            >
              {loading ? (
                <Loader2Icon className="size-4 animate-spin mr-2.5" />
              ) : (
                <PlusIcon className="size-4 mr-2.5" />
              )}
              Add Property
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
