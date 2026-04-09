import { apiFetch } from '@/lib/api';
import { $auth } from '@/store/auth';
import { $router, base } from '@/store/router';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  Command,
  FingerprintIcon,
  KeyIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('credentials');

  useEffect(() => {
    async function checkSignup() {
      try {
        const res = await apiFetch('/api/auth/registration-settings');
        const { data } = await res.json();
        setSignupEnabled(data.enabled === 'true');
      } catch (err) {
        setSignupEnabled(false);
      }
    }
    checkSignup();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        $auth.set({
          token: data.data.token || 'cookie',
          user: data.data.user || { email, role: 'admin' },
        });
        $router.open(base || '/');
      } else {
        if (data.code === 'SETUP_REQUIRED') {
          window.location.href = `${base}/setup`;
          return;
        }
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError('Enter your email to use Passkey login');
      return;
    }

    setPasskeyLoading(true);
    setError('');

    try {
      const optionsResponse = await apiFetch('/api/auth/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsResponse.ok) {
        const err = await optionsResponse.json();
        throw new Error(err.error || 'Failed to get passkey options');
      }

      const data = await optionsResponse.json();
      const asseResp = await startAuthentication({ optionsJSON: data.data });

      const verifyResponse = await apiFetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          response: asseResp,
        }),
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json();
        $auth.set({
          token: 'cookie',
          user: data.data.user || { email, role: 'admin' },
        });
        $router.open(base || '/');
      } else {
        const err = await verifyResponse.json();
        setError(err.error || 'Passkey verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Passkey authentication failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0_0)] flex flex-col items-center justify-center p-6 antialiased selection:bg-primary/10">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center gap-4 mb-2">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/20">
            <ShieldCheckIcon className="size-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">Access Flare</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1 opacity-60">
              Nexus Administrative Portal
            </p>
          </div>
        </div>

        <Card className="py-0 shadow-xl border-border/50 overflow-hidden bg-background/80 backdrop-blur-xl">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-8 pt-8">
              <TabsList className="grid grid-cols-2 w-full h-11 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger
                  value="credentials"
                  className="text-[10px] font-bold uppercase tracking-wider gap-2"
                >
                  <KeyIcon className="size-3" />
                  Credentials
                </TabsTrigger>
                <TabsTrigger
                  value="passkey"
                  className="text-[10px] font-bold uppercase tracking-wider gap-2"
                >
                  <FingerprintIcon className="size-3" />
                  Secure Key
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="px-8 pt-6 pb-8 min-h-[220px]">
              <TabsContent
                value="credentials"
                className="space-y-4 focus-visible:outline-none"
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email-cred"
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1"
                    >
                      Gateway Email
                    </Label>
                    <div className="relative group">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email-cred"
                        type="email"
                        placeholder="name@nexus.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 text-sm bg-muted/5 border-muted-foreground/10 focus:bg-background transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <Label
                        htmlFor="password"
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
                      >
                        Authorization Key
                      </Label>
                      <button
                        type="button"
                        className="text-[9px] text-primary font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                      >
                        Lost Access?
                      </button>
                    </div>
                    <div className="relative group">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 text-sm bg-muted/5 border-muted-foreground/10 focus:bg-background transition-all"
                        required
                      />
                    </div>
                  </div>

                  {error && activeTab === 'credentials' && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-[10px] font-bold text-center uppercase tracking-widest">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      'Authorize Session'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent
                value="passkey"
                className="space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <div className="space-y-2 text-center pb-2">
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Authenticate instantly using your device's biometric
                      sensors or security key.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email-pass"
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1"
                    >
                      Registered Email
                    </Label>
                    <div className="relative group">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email-pass"
                        type="email"
                        placeholder="name@nexus.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 text-sm bg-muted/5 border-muted-foreground/10 focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  {error && activeTab === 'passkey' && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-[10px] font-bold text-center uppercase tracking-widest">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <Button
                      type="button"
                      className="w-full h-14 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 flex flex-col gap-1 items-center justify-center py-8"
                      onClick={handlePasskeyLogin}
                      disabled={passkeyLoading}
                    >
                      {passkeyLoading ? (
                        <Loader2Icon className="size-5 animate-spin" />
                      ) : (
                        <>
                          <FingerprintIcon className="size-6" />
                          <span>Identify with Passkey</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="p-0 flex flex-col gap-6 px-8 pb-8 bg-muted/5 border-t border-muted-foreground/5">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/10" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em]">
                <span className="bg-background px-4 text-muted-foreground/40 font-bold">
                  External Auth
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-[10px] font-bold uppercase tracking-widest flex gap-3 border-muted-foreground/20 hover:bg-background shadow-xs"
              onClick={() => (window.location.href = `${base}/api/oauth/github/login`)}
            >
              <Command className="size-3.5" />
              Continue with GitHub
            </Button>

            {signupEnabled && (
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">
                  New Administrator?
                </p>
                <Button
                  variant="ghost"
                  className="w-full h-11 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/5 border border-primary/20 border-dashed"
                  onClick={() => $router.open('/signup')}
                >
                  Deploy New Identity
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
