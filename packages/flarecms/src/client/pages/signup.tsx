import React, { useState, useEffect } from 'react';
import { $router, navigate } from '../store/router';
import { $auth } from '../store/auth';
import { apiFetch } from '../lib/api';
import { LockIcon, MailIcon, Loader2Icon, UserIcon } from 'lucide-react';

import { Button } from '../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAvailability() {
      try {
        const res = await apiFetch('/auth/registration-settings');
        const { data } = await res.json();
        setSignupEnabled(data.enabled === 'true');
      } catch (err) {
        setSignupEnabled(false);
      } finally {
        setChecking(false);
      }
    }
    checkAvailability();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        $auth.set({
          token: data.data.token || 'cookie',
          user: data.data.user || { email, role: 'editor' },
        });
        navigate('home');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 antialiased">
      <div className="w-full max-w-[360px] space-y-8">
        <Card className="py-0 shadow-sm border-border">
          <CardHeader className="space-y-1 pb-4 pt-8 px-8">
            <CardTitle className="text-xl font-bold text-center tracking-tight">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Join the high-speed CMS network
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4 px-8 pb-8 pt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Email Address
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
                <Label
                  htmlFor="password"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
            <CardFooter className="flex flex-col gap-3 px-8 pb-8">
              <Button
                type="submit"
                className="w-full h-10 font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform"
                disabled={loading}
              >
                {loading ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : (
                  'Deploy Account'
                )}
              </Button>

              <button
                type="button"
                onClick={() => navigate('login')}
                className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest hover:text-foreground transition-colors mt-2"
              >
                Already have an account? Sign In
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
