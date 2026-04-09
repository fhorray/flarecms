import { useStore } from '@nanostores/react';
import { $router } from '@/store/router';
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  ShieldCheck as SecurityIcon,
  Globe as SeoIcon,
  Users as SignupIcon,
  Key as ApiIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function SettingsSidebar() {
  const page = useStore($router);

  const nav = [
    { label: 'General', route: 'settings_general', icon: SettingsIcon },
    { label: 'SEO', route: 'settings_seo', icon: SeoIcon },
    { label: 'Security', route: 'settings_security', icon: SecurityIcon },
    { label: 'Signup', route: 'settings_signup', icon: SignupIcon },
    { label: 'API Tokens', route: 'settings', icon: ApiIcon },
  ];

  return (
    <div className="w-full lg:w-64 space-y-1 pr-4">
      <div className="mb-8 px-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Settings
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground opacity-50 mt-1">
          System Configuration
        </p>
      </div>

      <div className="space-y-1">
        {nav.map((item) => {
          const isActive = page?.route === item.route;
          return (
            <Button
              key={item.route}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-10 px-3 text-xs font-semibold tracking-wide transition-all group relative overflow-hidden',
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              onClick={() =>
                $router.open(
                  item.route === 'settings'
                    ? '/settings'
                    : `/settings/${item.route.split('_')[1]}`,
                )
              }
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
              )}
              <item.icon
                className={cn(
                  'size-4 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'opacity-40 group-hover:opacity-100',
                )}
              />
              {item.label}
              <ChevronRightIcon
                className={cn(
                  'size-3 ml-auto opacity-0 -translate-x-1 transition-all',
                  isActive && 'opacity-20 translate-x-0',
                )}
              />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-container mx-auto py-8 px-6 flex flex-col lg:flex-row gap-12">
      <SettingsSidebar />
      <div className="flex-1 space-y-8">
        <div className="border-b border-border/50 pb-8 relative">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {subtitle}
          </p>
          <div className="absolute -bottom-px left-0 w-12 h-px bg-primary" />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
