import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  DatabaseIcon,
  Loader2Icon,
  SparklesIcon,
  PlusIcon,
} from 'lucide-react';
import { $createCollection } from '../store/collections';
import type { Collection } from '../types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollectionModal({ isOpen, onClose }: CollectionModalProps) {
  const [formData, setFormData] = useState<Partial<Collection>>({
    label: '',
    slug: '',
    labelSingular: '',
  });

  const { mutate, loading } = useStore($createCollection);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutate(formData);
      onClose();
      setFormData({ label: '', slug: '', labelSingular: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-background rounded-md shadow-lg">
        <DialogHeader className="px-8 py-8 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-background border rounded-md shadow-sm">
              <SparklesIcon className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                New Collection
              </DialogTitle>
              <DialogDescription className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                Initialize Data Structure
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                  Collection Label
                </Label>
                <Input
                  required
                  placeholder="e.g. Blog Posts"
                  className="h-10 bg-muted/20 focus:bg-background transition-all border-border rounded-md px-4 text-sm font-medium"
                  value={formData.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const slug = label
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                    setFormData({
                      ...formData,
                      label,
                      slug,
                      labelSingular: label.replace(/s$/i, ''),
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    Slug ID
                  </Label>
                  <div className="relative">
                    <DatabaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                    <Input
                      required
                      className="pl-9 h-10 bg-muted/20 focus:bg-background transition-all border-border rounded-md font-mono text-[11px] font-semibold text-muted-foreground uppercase"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    Singular Name
                  </Label>
                  <Input
                    required
                    className="h-10 bg-muted/20 focus:bg-background transition-all border-border rounded-md px-4 text-sm font-medium"
                    placeholder="e.g. Post"
                    value={formData.labelSingular}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labelSingular: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/10 border-t p-6 px-8 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground h-10 px-6"
            >
              Cancel
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
              Create Structure
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
