import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import {
  Loader2Icon,
  SaveIcon,
  XIcon,
  ShieldIcon,
  GlobeIcon,
  UserCheckIcon,
} from 'lucide-react';
import { updateSettingsLocally } from '../../store/settings';

export function SignupSection() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainRole, setNewDomainRole] = useState('viewer');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings').json<any>();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/settings', { json: settings });
      updateSettingsLocally(settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const domainRules = JSON.parse(
    settings['flare:signup_domain_rules'] || '{}',
  ) as Record<string, string>;

  const addDomainRule = () => {
    if (!newDomain) return;
    const newRules = { ...domainRules, [newDomain]: newDomainRole };
    update('flare:signup_domain_rules', JSON.stringify(newRules));
    setNewDomain('');
  };

  const removeDomainRule = (domain: string) => {
    const newRules = { ...domainRules };
    delete newRules[domain];
    update('flare:signup_domain_rules', JSON.stringify(newRules));
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Loading
        configurations...
      </div>
    );

  return (
    <div className="space-y-12">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Registration Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Access Gate
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Determine if new users can register themselves or if the system
              remains invite-only.
            </p>
          </div>
          <div className="md:col-span-2 bg-card border rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  Self-Registration Enabled
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  If disabled, all signups will be rejected even from valid
                  domains.
                </p>
              </div>
              <Switch
                checked={settings['flare:signup_enabled'] === 'true'}
                onCheckedChange={(checked: boolean) =>
                  update('flare:signup_enabled', String(checked))
                }
              />
            </div>
          </div>
        </div>

        {/* Domain Policies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Domain Intelligence
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Automate role assignment based on the user's verified email
              domain.
            </p>
          </div>
          <div className="md:col-span-2 space-y-6 bg-card border rounded-xl p-8 shadow-sm">
            <div className="space-y-6">
              <div className="grid gap-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                  Provisioning Rules
                </Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                    <Input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="company.com"
                      className="pl-10 h-10"
                    />
                  </div>
                  <Select
                    value={newDomainRole}
                    onValueChange={(v) => setNewDomainRole(v || 'viewer')}
                  >
                    <SelectTrigger className="w-full sm:w-[130px] h-10 font-bold text-[10px] uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addDomainRule}
                    className="h-10 uppercase font-black text-[10px] tracking-widest px-6 shrink-0"
                  >
                    Map Rule
                  </Button>
                </div>

                <div className="space-y-2 mt-2">
                  {Object.entries(domainRules).map(([domain, role]) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-background border flex items-center justify-center text-muted-foreground shadow-sm">
                          <GlobeIcon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            @{domain}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
                            Maps to {role}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDomainRule(domain)}
                        className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  {Object.keys(domainRules).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed rounded-xl opacity-20">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                        No custom rules defined
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2 max-w-[240px] pt-4 border-t border-border/50">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <UserCheckIcon className="size-3 text-primary opacity-50" />
                  Fallback Default Role
                </Label>
                <Select
                  value={settings['flare:signup_default_role'] || 'viewer'}
                  onValueChange={(v: string) =>
                    update('flare:signup_default_role', v)
                  }
                >
                  <SelectTrigger className="h-10 font-bold uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground/60 italic leading-tight mt-1">
                  Assigned to valid signups not matching specific domain rules.
                </p>
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
            Sync Access Policy
          </Button>
        </div>
      </form>
    </div>
  );
}
