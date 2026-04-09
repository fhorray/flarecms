import {
  LayoutDashboard as LayoutDashboardIcon,
  Database as DatabaseIcon,
  Users as UsersIcon,
  Settings as SettingsIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon,
  MessageSquare as MessageSquareIcon,
  Menu as MenuIcon,
  LogOut as LogOutIcon,
  Sparkles as SparklesIcon,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { $router, base } from '@/store/router';
import { useStore } from '@nanostores/react';
import { $auth, logout } from '@/store/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

import { $settings } from '@/store/settings';

import {
  Collapsible,

  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';

import { $collections } from '@/store/collections';

import { Icon } from '@/components/ui/icon-picker';

interface AppSidebarProps {
  variant?: 'sidebar' | 'floating' | 'inset';
}

export function AppSidebar({ variant = 'sidebar' }: AppSidebarProps) {
  const page = useStore($router);
  const auth = useStore($auth);
  const settings = useStore($settings);
  const { data: collections } = useStore($collections);

  const menuGroups = [
    {
      label: 'Content',
      items: (collections || []).map((col) => ({
        label: col.label,
        icon: col.slug === 'pages' ? FileTextIcon : () => <Icon name={col.icon as any} />,
        route: `${base}/${col.slug}`,
      })),
    },
    {
      label: 'Manage',
      items: [
        {
          label: 'Collections',
          icon: DatabaseIcon,
          route: `${base}/collections`,
          active: page?.route === 'collections',
        },
      ],
    },
    {
      label: 'Admin',
      items: [
        {
          label: 'Users',
          icon: UsersIcon,
          route: `${base}/users`,
          active: page?.route === 'users',
        },
        {
          label: 'Settings',
          icon: SettingsIcon,
          route: `${base}/settings`,
          active: page?.route === 'settings',
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader className="flex flex-row items-center px-4 py-6 gap-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-[padding,justify-content]">
        <Tooltip>
          <TooltipTrigger render={<div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0 shadow-sm cursor-pointer" />}>
              <SparklesIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right" className="group-data-[collapsible=expanded]:hidden">
            {settings['flare:site_title'] || 'FlareCMS'}
          </TooltipContent>
        </Tooltip>
        <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
          <span className="font-semibold text-sidebar-foreground tracking-tight leading-none">
            {settings['flare:site_title'] || 'FlareCMS'}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {settings['flare:site_tagline'] || 'Management'}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={page?.route === 'home'}
                onClick={() => $router.open(base || '/')}
                tooltip="Dashboard"
              >
                <LayoutDashboardIcon />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                render={
                  <CollapsibleTrigger className="group/trigger flex w-full items-center">
                    {group.label}
                    <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
                  </CollapsibleTrigger>
                }
                className="group/label text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer group-data-[collapsible=icon]:hidden"
              />
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={
                            (item as any).active || page?.route === item.route.slice(1)
                          }
                          onClick={() => $router.open(item.route)}
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4 transition-[padding]">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
          <Tooltip>
            <TooltipTrigger render={<Avatar className="size-8 rounded-lg shrink-0 cursor-pointer" />}>
                <AvatarFallback className="text-[10px] font-semibold">
                  {auth.user?.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </TooltipTrigger>
            <TooltipContent side="right" className="group-data-[collapsible=expanded]:hidden">
              {auth.user?.email}
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium truncate leading-none mb-1 text-sidebar-foreground">
              {auth.user?.email.split('@')[0]}
            </p>
            <button
              onClick={() => logout()}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Sign out
            </button>
          </div>

          <SidebarMenu className="w-fit group-data-[collapsible=expanded]:block hidden">
             <SidebarMenuItem>
                <SidebarMenuButton size="sm" onClick={() => logout()} tooltip="Sign out" className="text-muted-foreground/50 hover:text-destructive">
                   <LogOutIcon />
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>

          <div className="group-data-[collapsible=icon]:block hidden">
             <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton size="sm" onClick={() => logout()} tooltip="Sign out" className="text-muted-foreground/50 hover:text-destructive">
                      <LogOutIcon />
                   </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
