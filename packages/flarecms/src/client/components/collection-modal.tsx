import React, { useState } from 'react';
import { Loader2Icon, ChevronRightIcon, SparklesIcon } from 'lucide-react';
import { api } from '../lib/api';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { IconPicker, Icon } from './ui/icon-picker';
import { Switch } from './ui/switch';
import { cn } from '../lib/utils';

interface CollectionModalProps {
  children: React.ReactElement;
}

export function CollectionModal({ children }: CollectionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    slug: '',
    label: '',
    labelSingular: '',
    description: '',
    icon: 'package' as any,
    isPublic: false,
  });

  const [isSlugDirty, setIsSlugDirty] = useState(false);
  const [isSingularDirty, setIsSingularDirty] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/collections', { json: data });
      setIsOpen(false);
      setData({
        slug: '',
        label: '',
        labelSingular: '',
        description: '',
        icon: 'package',
        isPublic: false,
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to create collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: any) => {
    setData((prev) => {
      const newData = { ...prev, [key]: value };

      if (key === 'label') {
        if (!isSlugDirty) {
          newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        if (!isSingularDirty) {
          newData.labelSingular = value.replace(/s$/i, '') || value;
        }
      }

      return newData;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Header Section */}
          <div className="bg-linear-to-b from-muted/50 to-background px-8 pt-8 pb-6 border-b">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <SparklesIcon className="size-3" />
                Infrastructure
              </div>
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Create Collection
            </DialogTitle>
            <p className="text-muted-foreground text-xs mt-1.5">
              Define the blueprint for your new high-performance data module.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Display Label
                </Label>
                <Input
                  value={data.label}
                  onChange={(e) => update('label', e.target.value)}
                  placeholder="Blog Posts"
                  required
                  className="h-10 font-medium"
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Singular Label
                </Label>
                <Input
                  value={data.labelSingular}
                  onChange={(e) => {
                    setIsSingularDirty(true);
                    update('labelSingular', e.target.value);
                  }}
                  placeholder="Post"
                  className="h-10 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Identification Slug
              </Label>
              <div className="relative group">
                <Input
                  value={data.slug}
                  onChange={(e) => {
                    setIsSlugDirty(true);
                    update('slug', e.target.value);
                  }}
                  placeholder="blog-posts"
                  required
                  className="h-10 font-mono text-xs pl-8 border-dashed group-focus-within:border-solid transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-mono text-xs">
                  /
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-2">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Module Icon
                </Label>
                <IconPicker
                  value={data.icon}
                  onValueChange={(v) => update('icon', v)}
                />
              </div>
              <div className="space-y-2.5 flex flex-col justify-center">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  Access Policy
                </Label>
                <div
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition-all duration-300',
                    data.isPublic
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border',
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      {data.isPublic ? 'Public API' : 'Private API'}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-none">
                      {data.isPublic ? 'Open to everyone' : 'Requires key'}
                    </span>
                  </div>
                  <Switch
                    checked={data.isPublic}
                    onCheckedChange={(checked) => update('isPublic', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 sticky bottom-0">
            <Button
              type="button"
              variant="ghost"
              className="font-semibold text-xs h-10 px-6"
              onClick={() => setIsOpen(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="font-bold text-xs h-10 px-8 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : null}
              Initialize Collection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
