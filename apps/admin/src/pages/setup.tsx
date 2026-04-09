import { useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { $router } from '@/store/router';
import { $auth } from '@/store/auth';

export function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title');
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      // 1. Run Setup (includes Migrations + Admin Creation + Auto-Login via Cookie)
      const res = await apiFetch('/api/setup', {
        method: 'POST',
        body: JSON.stringify({ title, email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete setup');
      }

      // 2. Auth store update (The API already sets the 'session' cookie)
      // We set the email in store for UI purposes
      $auth.set({
        token: data.data.token || 'cookie',
        user: data.data.user,
      });

      // 3. Mandatory Refresh
      // Using window.location instead of $router.open to ensure a clean application boot
      // after the database and settings have been initialized.
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full border border-border/40 shadow-sm rounded-lg p-8 bg-card relative overflow-hidden">
        {/* Subtle decorative grid/line background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none opacity-30"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Initial Setup
            </h1>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mt-2">
              Configure FlareCMS Admin
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-[11px] uppercase tracking-wider font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Site Title
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full bg-background border border-border/50 text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                placeholder="My CMS"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Admin Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-background border border-border/50 text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Admin Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full bg-background border border-border/50 text-sm px-3 py-2 rounded-md focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-md text-xs tracking-wider uppercase hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Configuring...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
