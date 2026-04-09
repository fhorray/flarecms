import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2Icon, SaveIcon, Share2Icon } from 'lucide-react';
import { updateSettingsLocally } from '../../store/settings';

export function SEOSection() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings').json<any>();
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

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Retrieving SEO
        architecture...
      </div>
    );

  return (
    <div className="space-y-12">
      <form onSubmit={handleSave} className="space-y-12">
        {/* Indexing & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Indexing & Search
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Configure how search engines discover and rank your content.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6 bg-card border rounded-xl p-8 shadow-sm">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Global Meta Description
                </Label>
                <Textarea
                  value={settings['flare:seo_meta_description'] || ''}
                  onChange={(e) =>
                    update('flare:seo_meta_description', e.target.value)
                  }
                  placeholder="The definitive guide to your platform..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-[9px] text-muted-foreground italic">
                  Fallback description for pages without explicit meta content.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    Google Verification
                  </Label>
                  <Input
                    value={settings['flare:seo_google_verification'] || ''}
                    onChange={(e) =>
                      update('flare:seo_google_verification', e.target.value)
                    }
                    placeholder="xv...7"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                    Bing Verification
                  </Label>
                  <Input
                    value={settings['flare:seo_bing_verification'] || ''}
                    onChange={(e) =>
                      update('flare:seo_bing_verification', e.target.value)
                    }
                    placeholder="89...A"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Presence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Social Presence
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Override how your content appears when shared across social
              networks.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6 bg-card border rounded-xl p-8 shadow-sm">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <Share2Icon className="size-3 text-primary" />
                  Default Social Share Image (OG)
                </Label>
                <Input
                  value={settings['flare:seo_og_image'] || ''}
                  onChange={(e) => update('flare:seo_og_image', e.target.value)}
                  placeholder="https://cdn.com/og-default.jpg"
                />
                <p className="text-[9px] text-muted-foreground italic">
                  Recommended size: 1200x630px.
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Twitter (@username)
                </Label>
                <Input
                  value={settings['flare:seo_twitter_handle'] || ''}
                  onChange={(e) =>
                    update('flare:seo_twitter_handle', e.target.value)
                  }
                  placeholder="@flarecms"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced SEO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Sitemap & Discovery
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Core automation handles for link integrity and crawling.
            </p>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border rounded-xl p-8 shadow-sm space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Robots.txt Payload
                </Label>
                <Textarea
                  value={
                    settings['flare:seo_robots_txt'] ||
                    'User-agent: *\nAllow: /'
                  }
                  onChange={(e) =>
                    update('flare:seo_robots_txt', e.target.value)
                  }
                  className="min-h-[120px] font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm border-t mt-12">
          <Button
            disabled={saving}
            size="sm"
            className="gap-2 font-bold uppercase tracking-widest text-[10px] h-10 px-6"
          >
            {saving ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <SaveIcon className="size-3" />
            )}
            Sync SEO Schema
          </Button>
        </div>
      </form>
    </div>
  );
}
