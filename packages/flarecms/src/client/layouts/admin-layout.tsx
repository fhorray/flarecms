import type { ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { $router } from '../store/router';
import { AppSidebar } from '../components/app-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import {
  Search as SearchIcon,
  Bell as BellIcon,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const page = useStore($router);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Site Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-4 px-6">
            <SidebarTrigger className="size-8 text-muted-foreground hover:text-foreground transition-colors" />

            <Separator orientation="vertical" className="h-4 bg-border" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-medium uppercase tracking-wider leading-none mb-0.5">
                {page?.route === 'home'
                  ? 'Administration'
                  : page?.route === 'collections'
                    ? 'Infrastructure'
                    : 'Resource'}
              </div>
              <h2 className="text-foreground font-semibold text-sm tracking-tight capitalize leading-none">
                {page?.route === 'home'
                  ? 'Dashboard'
                  : page?.route === 'collections'
                    ? 'Collections Manager'
                    : page?.route?.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="relative hidden lg:block group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-colors" />
                <input
                  type="text"
                  placeholder="Universal search..."
                  className="bg-muted/50 border h-9 w-64 rounded-md pl-9 pr-4 text-xs focus:bg-background transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground relative hover:text-primary transition-colors size-8"
                >
                  <BellIcon className="size-4" />
                  <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-background"></span>
                </Button>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary hover:bg-primary/5 h-8 px-4"
                >
                  Live Preview
                  <ExternalLinkIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto w-full bg-muted/20">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
