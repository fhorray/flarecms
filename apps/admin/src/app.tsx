import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $router } from '@/store/router';
import { $auth } from '@/store/auth';
import { $collections } from '@/store/collections';
import { loadSettings } from '@/store/settings';
import { apiFetch } from '@/lib/api';

import { AdminLayout } from '@/layouts/admin-layout';
import { LoginPage } from '@/pages/login';
import { SetupPage } from '@/pages/setup';
import { SignupPage } from '@/pages/signup';
import { DashboardPage } from '@/pages/dashboard';
import { CollectionsPage } from '@/pages/collections';
import { CollectionDetailPage } from '@/pages/collection-detail';
import { DevicePage } from '@/pages/device';
import { SettingsPage } from '@/pages/settings';
import { DocumentsPage } from '@/pages/documents-page';
import { DocumentDetailPage } from '@/pages/document-detail-page';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  const page = useStore($router);
  const auth = useStore($auth);
  const collections = useStore($collections);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function checkSetup() {
      try {
        // Initial check to trigger Zero-Config redirect if needed
        await apiFetch('/api/health');
        // Load global settings
        await loadSettings();
      } catch (err) {
        console.error('Initial setup check failed:', err);
      } finally {
        setBooting(false);
      }
    }
    checkSetup();
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 antialiased">
        <div className="size-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-8 border border-border/50 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary opacity-60"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 animate-pulse">
            System Synchronizing
          </h2>
          <p className="text-[9px] font-semibold text-muted-foreground/30 uppercase tracking-[0.2em]">
            Establishing Secure Link
          </p>
        </div>
      </div>
    );
  }

  // If setup route is active, bypass Auth Guard
  if (page?.route === 'setup') {
    return (
      <TooltipProvider>
        <SetupPage />
      </TooltipProvider>
    );
  }

  // Auth Guard: If no token, show Login or Signup based on route
  if (!auth.token) {
    return (
      <TooltipProvider>
        {page?.route === 'signup' ? <SignupPage /> : <LoginPage />}
      </TooltipProvider>
    );
  }

  // Router Logic for authenticated users
  if (!page) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground p-6">
          <div className="text-center max-w-sm">
            <h1 className="text-6xl font-black mb-4 tracking-tighter text-foreground opacity-10">404</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-8">
              Document Module Not Found
            </p>
            <button
              onClick={() => $router.open('/')}
              className="px-4 py-2 border rounded-md text-xs font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Return to Nexus
            </button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Admin pages wrapped in shared Layout
  return (
    <TooltipProvider>
      <AdminLayout>
        {page.route === 'home' && <DashboardPage />}
        {page.route === 'collections' && <CollectionsPage />}
        {page.route === 'device' && <DevicePage />}
        {page.route.startsWith('settings') && <SettingsPage />}
        
        {page.route === 'collection' && (
          <CollectionDetailPage
            id={page.params.id}
            slug={page.params.slug}
            onBack={() => $router.open('/collections')}
          />
        )}

        {page.route === 'document_list' && <DocumentsPage />}
        {page.route === 'document_edit' && <DocumentDetailPage />}
        
        {/* Login route while already authenticated -> redirect to home via layout logic or just show dashboard */}
        {page.route === 'login' && <DashboardPage />}

        {!['home', 'collections', 'collection', 'document_list', 'document_edit', 'login', 'setup', 'device', 'settings', 'settings_general', 'settings_seo', 'settings_security', 'settings_signup'].includes(page.route) && (

          <div className="flex flex-col items-center justify-center py-40">
            <div className="size-16 bg-muted rounded-xl flex items-center justify-center mb-8 border shadow-sm">
              <div className="size-6 bg-primary/20 rounded-lg animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Module Isolation
            </h2>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em] mt-3">
              Feature currently offline
            </p>
          </div>
        )}
      </AdminLayout>
    </TooltipProvider>
  );
}
