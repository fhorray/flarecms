import React, { useState } from 'react';
import { $auth } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import { LockIcon, MailIcon, Loader2Icon, SparklesIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          token: data.token,
          user: { email, role: 'admin' },
        });
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 antialiased">
      <div className="w-full max-w-[360px] space-y-8">
        <div className="text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm mb-6">
            <SparklesIcon className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            FlareCMS
          </h1>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em] mt-1 space-x-1">
            Admin Infrastructure
          </p>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader className="space-y-1 pb-4 pt-8 px-8">
            <CardTitle className="text-xl font-bold text-center tracking-tight">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Enter credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 px-8 pb-8 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 text-sm"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-medium text-center">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-6 px-8 pb-8">
              <Button
                type="submit"
                className="w-full h-10 font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform"
                disabled={loading}
              >
                {loading ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : (
                  'Authorize'
                )}
              </Button>
              <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Key Recovery
                </span>
                <span className="hover:text-primary cursor-pointer transition-colors">
                  Support
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-muted-foreground/20 text-[9px] font-semibold uppercase tracking-[0.3em] whitespace-nowrap">
          v1.2.0 &bull; Secure Protocol Active
        </p>
      </div>
    </div>
  );
}
