import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2Icon, SaveIcon, LayoutIcon, GlobeIcon, SettingsIcon, ShieldAlertIcon } from 'lucide-react';
import { updateSettingsLocally } from '@/store/settings';

export function GeneralSection() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/api/settings').json<any>();
        setSettings(data);
      } catch (err) {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/settings', { json: settings });
      updateSettingsLocally(settings);
    } catch (err) {}
    setSaving(false);
  };

  const update = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2Icon className="size-4 animate-spin" /> Retrieving site identity...</div>;

  return (
    <div className="space-y-12">
      <form onSubmit={handleSave} className="space-y-12">
        {/* Site Identity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Site Identity</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Fundamental information used in headers, metadata, and browser tabs.</p>
          </div>
          <div className="md:col-span-2 space-y-6 bg-card border rounded-xl p-8 shadow-sm">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Site Title</Label>
                <Input value={settings['flare:site_title'] || ''} onChange={e => update('flare:site_title', e.target.value)} placeholder="My Awesome Blog" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tagline</Label>
                <Input value={settings['flare:site_tagline'] || ''} onChange={e => update('flare:site_tagline', e.target.value)} placeholder="Thoughts on the digital world" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Base URL</Label>
              <Input value={settings['flare:site_url'] || ''} onChange={e => update('flare:site_url', e.target.value)} placeholder="https://flarecms.dev" />
              <p className="text-[9px] text-muted-foreground italic">Important for canonical links and XML sitemaps.</p>
            </div>
          </div>
        </div>

        {/* Branding & Assets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Design Assets</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Visual identity markers for your public site and administrative panel.</p>
          </div>
          <div className="md:col-span-2 space-y-6 bg-card border rounded-xl p-8 shadow-sm">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Public Logo URL</Label>
                <Input value={settings['flare:site_logo'] || ''} onChange={e => update('flare:site_logo', e.target.value)} placeholder="https://cdn.com/logo.png" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Admin Panel Logo URL</Label>
                <Input value={settings['flare:admin_logo'] || ''} onChange={e => update('flare:admin_logo', e.target.value)} placeholder="https://cdn.com/admin-logo.png" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Favicon Shortcut URL</Label>
                <Input value={settings['flare:site_favicon'] || ''} onChange={e => update('flare:site_favicon', e.target.value)} placeholder="https://cdn.com/favicon.ico" />
              </div>
            </div>
          </div>
        </div>

        {/* System Operations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Operations</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Site-wide status and SEO architecture configuration.</p>
          </div>
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-foreground">Maintenance Mode</p>
                     <p className="text-[10px] text-muted-foreground/60">Take your site offline for users while you work on it. Admins still have access.</p>
                  </div>
                  <Switch 
                  checked={settings['flare:signup_enabled'] === 'true'} 
                  onCheckedChange={(checked: boolean) => update('flare:signup_enabled', String(checked))}
                />
               </div>
               
               <div className="pt-6 border-t space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Site Title SEO Pattern</Label>
                  <Input value={settings['flare:site_title_pattern'] || '%title% | %site_name%'} onChange={e => update('flare:site_title_pattern', e.target.value)} placeholder="%title% | %site_name%" />
                  <p className="text-[9px] text-muted-foreground/60">Supported vars: %title%, %site_name%, %tagline%</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm border-t mt-12">
          <Button disabled={saving} size="sm" className="gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-6">
            {saving ? <Loader2Icon className="size-3 animate-spin" /> : <SaveIcon className="size-3" />}
            Sync Site Identity
          </Button>
        </div>
      </form>
    </div>
  );
}
