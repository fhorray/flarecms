import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Loader2Icon,
  PlusIcon,
  KeyIcon,
  Trash2Icon,
  CopyIcon,
  CalendarIcon,
  ShieldIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function APITokenSection() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [granularScopes, setGranularScopes] = useState<any[]>([]); // Array of { resource, actions }
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const systemResources = [
    {
      id: 'system.users',
      label: 'Users & Roles',
      desc: 'Manage administrative users',
    },
    {
      id: 'system.settings',
      label: 'Site Settings',
      desc: 'Modify global configurations',
    },
    {
      id: 'system.collections',
      label: 'Schema Engine',
      desc: 'Create and modify collections',
    },
  ];

  const fetchTokens = async () => {
    try {
      const res = await api.get('/api/tokens');
      const data = await res.json<any>();
      setTokens(data.data || []);
    } catch (err) {}
    setFetching(false);
  };

  const fetchCollections = async () => {
    try {
      const res = await api.get('/api/collections');
      const data = await res.json<any>();
      setCollections(data.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchTokens();
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNewToken('');

    try {
      const res = await api
        .post('/api/tokens', {
          json: {
            name,
            scopes: granularScopes,
          },
        });
      const data = await res.json<any>();
      setNewToken(data.data.token);
      setName('');
      setGranularScopes([]);
      fetchTokens();
    } catch (err) {}
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (
      !confirm(
        'Revoke this access token? This action is immediate and permanent.',
      )
    )
      return;
    await api.delete(`/api/tokens/${id}`);
    fetchTokens();
  };

  const togglePermission = (resource: string, action: string) => {
    setGranularScopes((prev) => {
      const existing = prev.find((s) => s.resource === resource);
      if (existing) {
        const newActions = existing.actions.includes(action)
          ? existing.actions.filter((a: string) => a !== action)
          : [...existing.actions, action];

        if (newActions.length === 0)
          return prev.filter((s) => s.resource !== resource);
        return prev.map((s) =>
          s.resource === resource ? { ...s, actions: newActions } : s,
        );
      }
      return [...prev, { resource, actions: [action] }];
    });
  };

  const isChecked = (resource: string, action: string) => {
    return granularScopes
      .find((s) => s.resource === resource)
      ?.actions.includes(action);
  };

  if (fetching)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Retrieving active
        tokens...
      </div>
    );

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Issue Credential
          </h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Personal Access Tokens allow secure programmatic access for external
            scripts and AI agents.
          </p>
        </div>
        <div className="md:col-span-2 bg-card border rounded-xl overflow-hidden shadow-sm">
          <form onSubmit={handleCreate} className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Token Designation
                </Label>
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  required
                  placeholder="e.g. CI/CD Pipeline"
                  className="h-11 font-medium"
                />
              </div>

              <div className="grid gap-4 mt-6">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Permissions
                </Label>

                <Accordion className="w-full border rounded-lg bg-muted/5">
                  {/* Content Collections */}
                  <AccordionItem value="content" className="border-none px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <ShieldIcon className="size-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Content Collections
                        </span>
                      </div>
                    </AccordionTrigger>
                    {collections.length === 0 ? (
                      <AccordionContent className="pb-6 space-y-4">
                        <p className="text-xs text-center1 text-muted-foreground font-medium">
                          No collections found
                        </p>
                      </AccordionContent>
                    ) : (
                      <AccordionContent className="pb-6 space-y-4">
                        {collections.map((col) => (
                          <div
                            key={col.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-background group"
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold capitalize">
                                {col.label}
                              </p>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase opacity-50">
                                {col.slug}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {['read', 'write', 'update', 'delete'].map(
                                (action) => (
                                  <label
                                    key={action}
                                    className="flex items-center gap-2 cursor-pointer group/label"
                                  >
                                    <Checkbox
                                      checked={isChecked(col.slug, action)}
                                      onCheckedChange={() =>
                                        togglePermission(col.slug, action)
                                      }
                                    />
                                    <span className="text-[10px] uppercase font-black tracking-tighter opacity-70 group-hover/label:opacity-100">
                                      {action}
                                    </span>
                                  </label>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    )}
                  </AccordionItem>

                  {/* System Resources */}
                  <AccordionItem value="system" className="border-none px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <ShieldIcon className="size-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          System Resources
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 space-y-4">
                      {systemResources.map((res) => (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-background group"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold">{res.label}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight">
                              {res.desc}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {['read', 'write', 'update'].map((action) => (
                              <label
                                key={action}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={isChecked(res.id, action)}
                                  onCheckedChange={() =>
                                    togglePermission(res.id, action)
                                  }
                                />
                                <span className="text-[10px] uppercase font-black tracking-tighter opacity-70">
                                  {action}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <Button
              disabled={loading || !name || granularScopes.length === 0}
              className="w-full h-11 gap-2 font-bold uppercase tracking-widest text-[10px]"
            >
              {loading ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <PlusIcon className="size-4" />
              )}
              Generate Access Secret
            </Button>

            {newToken && (
              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <ShieldIcon className="size-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    Secret Vaulted Successfully
                  </p>
                </div>
                <div className="relative group">
                  <code className="text-xs break-all text-foreground bg-background p-4 rounded-lg block border font-mono">
                    {newToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 size-8 text-muted-foreground hover:text-primary"
                    onClick={() => navigator.clipboard.writeText(newToken)}
                  >
                    <CopyIcon className="size-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-primary/70 font-bold uppercase mt-4 tracking-tighter italic">
                  Warning: This secret will not be displayed again. Store it
                  securely.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            Active Ledger
          </h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Review and manage active credentials for your account.
          </p>
        </div>
        <div className="md:col-span-2 space-y-4">
          {tokens.map((t: any) => (
            <div
              key={t.id}
              className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-primary/20 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-primary/5 rounded flex items-center justify-center text-primary border border-primary/10">
                    <KeyIcon className="size-4" />
                  </div>
                  <p className="text-sm font-bold text-foreground tracking-tight">
                    {t.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-50 px-1 border rounded">
                    {t.id}
                  </span>
                  {Array.isArray(t.scopes) &&
                    t.scopes.map((s: any, idx: number) => {
                      const label =
                        typeof s === 'string'
                          ? s
                          : `${s.resource}:${s.actions.join(',')}`;
                      return (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[8px] uppercase font-bold tracking-widest px-1.5 h-4 border-primary/20 text-primary/60"
                        >
                          {label}
                        </Badge>
                      );
                    })}
                </div>
                <div className="flex items-center gap-3 pl-1 pt-1 opacity-50">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-tighter text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    Created: {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(t.id)}
                className="text-[10px] font-black uppercase tracking-widest h-8 px-3 text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              >
                Revoke Access
              </Button>
            </div>
          ))}

          {tokens.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest">
                No active credentials recorded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
