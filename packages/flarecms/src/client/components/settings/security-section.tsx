import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { startRegistration } from '@simplewebauthn/browser';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2Icon, ShieldCheckIcon, PlusIcon, MonitorIcon, SmartphoneIcon, Trash2Icon } from 'lucide-react';

export function SecuritySection() {
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [passkeyName, setPasskeyName] = useState('');

  const fetchPasskeys = async () => {
    const res = await apiFetch('/auth/passkeys');
    if (res.ok) {
      const result = await res.json();
      setPasskeys(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    setRegistering(true);
    setError('');
    try {
      // 1. Get options from backend
      const optionsRes = await apiFetch('/auth/passkey/register/options', { method: 'POST' });
      if (!optionsRes.ok) throw new Error('Failed to get registration options');
      const optionsData = await optionsRes.json();
      const options = optionsData.data;

      // 2. Start registration on client
      const attestationResponse = await startRegistration(options);

      // 3. Verify on backend (include name)
      const verifyRes = await apiFetch('/auth/passkey/register/verify', {
        method: 'POST',
        body: JSON.stringify({
          ...attestationResponse,
          name: passkeyName || undefined
        }),
      });

      if (verifyRes.ok) {
        setPasskeyName('');
        fetchPasskeys();
      } else {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (pkId: string) => {
    if (!confirm('Revoke this security key? You will no longer be able to use it to sign in.')) return;
    const res = await apiFetch(`/auth/passkey/${pkId}`, { method: 'DELETE' });
    if (res.ok) fetchPasskeys();
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2Icon className="size-4 animate-spin" /> Loading security profile...</div>;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Passkeys</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Passkeys provide a high-security, passwordless authentication experience using biometric or hardware-bound keys.</p>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            {passkeys.map((pk) => (
              <div key={pk.id} className="bg-card border rounded-xl p-5 flex items-center justify-between group hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-muted/50 rounded-lg flex items-center justify-center border text-muted-foreground group-hover:text-primary transition-colors">
                    {pk.device_type === 'singleDevice' ? <SmartphoneIcon className="size-5" /> : <MonitorIcon className="size-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-foreground">
                        {pk.name || (pk.device_type === 'singleDevice' ? 'Handheld Decryptor' : 'Workstation Bound')}
                       </p>
                       <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-tighter h-4 px-1 leading-none">Secure</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-muted-foreground font-medium font-mono opacity-50 uppercase">{pk.id.substring(0, 16)}...</span>
                       <span className="text-[10px] text-muted-foreground/30">•</span>
                       <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                         Last active: {pk.last_used_at ? new Date(pk.last_used_at).toLocaleDateString() : 'Never'}
                       </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(pk.id)}
                >
                   <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}

            {passkeys.length === 0 && (
              <div className="bg-muted/10 border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center">
                 <ShieldCheckIcon className="size-8 text-muted-foreground/30 mb-4" />
                 <p className="text-sm font-semibold text-muted-foreground">No passkeys registered</p>
                 <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">Protect your account with modern credentials</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleAddPasskey} 
            disabled={registering}
            className="w-full h-12 gap-2 font-bold uppercase tracking-widest text-[10px] transition-all hover:shadow-lg hover:shadow-primary/10"
          >
            {registering ? <Loader2Icon className="size-3 animate-spin" /> : <PlusIcon className="size-4" />}
            Register New Security Key
          </Button>
          
          {error && <p className="text-[11px] text-destructive font-medium text-center">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-12">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Advanced Protection</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Additional controls to manage session persistence and security levels.</p>
        </div>
        <div className="md:col-span-2 space-y-4">
           {/* Placeholder for more security settings */}
           <div className="bg-muted/5 border rounded-lg p-4 opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between">
                 <span className="text-xs font-bold uppercase tracking-widest">Multi-Factor Enforcement</span>
                 <div className="size-4 rounded-full border border-muted-foreground/30" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
