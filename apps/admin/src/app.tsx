import { useStore } from '@nanostores/react';
import { $router } from '@/store/router';
import { $auth } from '@/store/auth';
import { $collections } from '@/store/collections';

import { AdminLayout } from '@/layouts/admin-layout';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { CollectionsPage } from '@/pages/collections';
import { CollectionDetailPage } from '@/pages/collection-detail';
import { RecordsPage } from '@/pages/records-page';
import { RecordDetailPage } from '@/pages/record-detail-page';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  const page = useStore($router);
  const auth = useStore($auth);

  // Auth Guard: If no token, ALWAYS show LoginPage without any layout
  if (!auth.token) {
    return (
      <TooltipProvider>
        <LoginPage />
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
              Module Node Not Found
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

  const collections = useStore($collections);

  // Admin pages wrapped in shared Layout
  return (
    <TooltipProvider>
      <AdminLayout>
        {page.route === 'home' && <DashboardPage />}
        {page.route === 'collections' && <CollectionsPage />}
        
        {page.route === 'collection' && (
          <CollectionDetailPage
            id={page.params.id}
            slug={page.params.slug}
            onBack={() => $router.open('/collections')}
          />
        )}

        {page.route === 'record_list' && <RecordsPage />}
        {page.route === 'record_edit' && <RecordDetailPage />}
        
        {/* Login route while already authenticated -> redirect to home via layout logic or just show dashboard */}
        {page.route === 'login' && <DashboardPage />}

        {!['home', 'collections', 'collection', 'record_list', 'record_edit', 'login'].includes(page.route) && (
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
