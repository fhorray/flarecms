import { FieldModal } from '../components/field-modal';
import { api } from '../lib/api';
import { $activeSlug, $reloadSchema, $schema } from '../store/schema';
import { useStore } from '@nanostores/react';
import {
  ActivityIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  HashIcon,
  ListIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  Settings2Icon,
  TerminalIcon,
  TypeIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { IconPicker } from '../components/ui/icon-picker';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

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
  const { data: schema, loading, error } = useStore($schema);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('fields');

  useEffect(() => {
    $activeSlug.set(slug);
    return () => $activeSlug.set(null);
  }, [slug]);

  useEffect(() => {
    if (schema && !settings) {
      setSettings({
        label: schema.label,
        labelSingular: schema.label_singular || '',
        description: schema.description || '',
        icon: schema.icon || 'Package',
        isPublic: schema.is_public === 1,
        urlPattern: schema.url_pattern || '',
        features: schema.features || [],
      });
    }
  }, [schema]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.patch(`/collections/${id}`, { json: settings });
      $reloadSchema();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setSettings((prev: any) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f: string) => f !== feature)
        : [...prev.features, feature],
    }));
  };

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

  if (!schema || error) {
    return (
      <div className="p-6 max-w-container mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="size-9 rounded-md shrink-0"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">System Notice</h1>
        </div>
        <Card className="py-20 text-center border-dashed">
          <DatabaseIcon className="size-12 mx-auto mb-4 opacity-5" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
            No collection found
          </p>
          <p className="text-[10px] mt-1 font-medium text-muted-foreground/50">
            The requested data structure does not exist or has been
            decommissioned.
          </p>
        </Card>
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 border">
            <TabsTrigger
              value="fields"
              className="text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <ListIcon className="size-3" />
              Fields
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <Settings2Icon className="size-3" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="explorer"
              className="text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <SearchIcon className="size-3" />
              Explorer
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="hidden">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
        </TabsList>

        <TabsContent
          value="fields"
          className="space-y-8 mt-0 focus-visible:outline-none"
        >
          <div className="flex justify-end px-1">
            <FieldModal collectionId={id} collectionSlug={slug}>
              <Button size="sm" className="font-semibold h-9 px-6 text-xs">
                <PlusIcon className="size-3.5 mr-2" />
                Add Field
              </Button>
            </FieldModal>
          </div>

          <Card className="py-0 shadow-none border-border overflow-hidden">
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
                    <TableHead className="w-[40%] pl-6 py-3">
                      Property
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint Key</TableHead>
                    <TableHead className="text-right pr-6">
                      Validation
                    </TableHead>
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
        </TabsContent>

        <TabsContent
          value="settings"
          className="space-y-8 mt-0 focus-visible:outline-none"
        >
          {settings && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">
                      General Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                          Label (Plural)
                        </Label>
                        <Input
                          value={settings.label}
                          onChange={(e) =>
                            setSettings({ ...settings, label: e.target.value })
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                          Label (Singular)
                        </Label>
                        <Input
                          value={settings.labelSingular}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              labelSingular: e.target.value,
                            })
                          }
                          className="h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        Visual Identifier
                      </Label>
                      <IconPicker
                        value={settings.icon}
                        onValueChange={(v) =>
                          setSettings({ ...settings, icon: v })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">
                      Routing & Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        URL Pattern
                      </Label>
                      <Input
                        value={settings.urlPattern}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            urlPattern: e.target.value,
                          })
                        }
                        placeholder="/blog/{slug}"
                        className="h-10 font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Defines the frontend URL structure for documents in this
                        collection.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <GlobeIcon className="size-3.5 text-primary" />
                          <p className="text-xs font-bold text-primary">
                            Public API Visibility
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          If enabled, this collection will be accessible without
                          an API token for read-only operations.
                        </p>
                      </div>
                      <Switch
                        checked={settings.isPublic}
                        onCheckedChange={(v) =>
                          setSettings({ ...settings, isPublic: v })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                      Feature Toggles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        id: 'searchable',
                        label: 'Searchable',
                        desc: 'Index content for global search',
                        icon: SearchIcon,
                      },
                      {
                        id: 'seo',
                        label: 'SEO Metadata',
                        desc: 'Enable meta title/desc support',
                        icon: GlobeIcon,
                      },
                      {
                        id: 'drafts',
                        label: 'Draft Mode',
                        desc: 'Enable publish/unpublish workflow',
                        icon: FileTextIcon,
                      },
                    ].map((feat) => (
                      <div
                        key={feat.id}
                        className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20 group hover:border-primary/20 transition-colors"
                      >
                        <div className="size-8 rounded bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <feat.icon className="size-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold leading-none">
                              {feat.label}
                            </p>
                            <Switch
                              checked={settings.features.includes(feat.id)}
                              onCheckedChange={() => toggleFeature(feat.id)}
                              className="scale-75"
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full h-12 font-black uppercase tracking-widest text-[10px] gap-2"
                >
                  {saving ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SaveIcon className="size-4" />
                  )}
                  Update Configuration
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="explorer"
          className="mt-0 focus-visible:outline-none space-y-8"
        >
          <div className="flex items-center gap-2 px-1">
            <ActivityIcon className="size-3.5 text-primary" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              Collection Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Activity Stream */}
            <Card className="bg-muted/5 border shadow-none overflow-hidden">
              <CardHeader className="py-4 px-6 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  System Activity Log
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-50 text-green-600">
                    Live
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {[
                    {
                      event: 'Schema optimized for production',
                      time: '2m ago',
                      user: 'System',
                    },
                    {
                      event: `Structure '${schema.label}' successfully initialized`,
                      time: '1h ago',
                      user: 'Admin',
                    },
                    {
                      event: 'Public API permissions finalized',
                      time: '3h ago',
                      user: 'Admin',
                    },
                    {
                      event: 'PostgreSQL table isolation complete',
                      time: 'Yesterday',
                      user: 'System',
                    },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors cursor-default">
                          {log.event}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-medium">
                          Mapped by {log.user}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/30 font-bold">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* API Reference */}
            <Card className="py-0 bg-primary/5 border-primary/20 shadow-none overflow-hidden h-fit">
              <CardHeader className="py-4 px-6 border-b border-primary/10 bg-primary/10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Primary Endpoint Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Use this endpoint to interface with the data module
                    programmatically from your external applications.
                  </p>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background border shadow-sm group">
                    <TerminalIcon className="size-4 text-primary ml-1 shrink-0" />
                    <code className="flex-1 text-[11px] font-mono font-bold text-foreground overflow-hidden truncate px-1">
                      GET {window.location.origin}/api/content/{slug}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/api/content/${slug}`,
                        );
                      }}
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-10 text-[10px] font-bold uppercase tracking-widest gap-2"
                    onClick={() =>
                      window.open(
                        `${window.location.origin}/api/content/${slug}`,
                        '_blank',
                      )
                    }
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    Test Request
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 text-[10px] font-bold uppercase tracking-widest gap-2 opacity-50 cursor-not-allowed"
                  >
                    <TerminalIcon className="size-3.5" />
                    SDK Snippets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
