import {
  LayoutDashboardIcon,
  DatabaseIcon,
  UsersIcon,
  SettingsIcon,
  FileTextIcon,
  LayersIcon,
  MessageSquareIcon,
  MenuIcon,
  LogOutIcon,
  SparklesIcon,
  PuzzleIcon,
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
} from './ui/sidebar';
import { $router, navigate, type RouteName } from '../store/router';
import { useStore } from '@nanostores/react';
import { $auth, logout } from '../store/auth';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useSidebar } from './ui/sidebar';

import { $settings } from '../store/settings';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { ChevronRight } from 'lucide-react';

import { $collections } from '../store/collections';
import { $plugins, type PluginManifest } from '../store/plugins';

import { Icon, type IconName } from './ui/icon-picker';
import type { Collection } from '../types';
import React, { useMemo } from 'react';

interface AppSidebarProps {
  variant?: 'sidebar' | 'floating' | 'inset';
}

interface MenuItem {
  label: string;
  icon: React.ElementType | IconName;
  routeName: RouteName;
  params?: Record<string, string | number | boolean | undefined>;
  active?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function AppSidebar({ variant = 'sidebar' }: AppSidebarProps) {
  const page = useStore($router);
  const auth = useStore($auth);
  const settings = useStore($settings);
  const { data: collections } = useStore($collections);
  const { data: plugins } = useStore($plugins);

  const menuGroups = useMemo(() => {
    const groups: MenuGroup[] = [
      {
        label: 'Content',
        items: (collections || []).map((col: Collection) => ({
          label: col.label,
          icon:
            col.slug === 'pages'
              ? FileTextIcon
              : (col.icon as IconName),
          routeName: 'document_list',
          params: { slug: col.slug },
          active: page?.route === 'document_list' && page.params.slug === col.slug,
        })),
      },
      {
        label: 'Manage',
        items: [
          {
            label: 'Collections',
            icon: DatabaseIcon,
            routeName: 'collections',
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
            routeName: 'users',
            active: page?.route === 'users',
          },
          {
            label: 'Settings',
            icon: SettingsIcon,
            routeName: 'settings',
            active: page?.route === 'settings',
          },
          {
            label: 'Plugins',
            icon: PuzzleIcon,
            routeName: 'plugins',
            active: page?.route === 'plugins',
          },
        ],
      },
    ];

    // Dynamically add Plugin groups if they have pages
    (plugins || []).forEach((plugin: PluginManifest) => {
      if (plugin.pages && plugin.pages.length > 0) {
        // Filter out internal pages and widgets
        const visiblePages = plugin.pages.filter(
          (p) => !p.path.startsWith('__') && !p.path.includes('/__')
        );

        if (visiblePages.length > 0) {
          groups.push({
            label: plugin.name || plugin.id,
            items: visiblePages.map((p) => ({
              label: p.label || p.path,
              icon: (p.icon as IconName) || PuzzleIcon,
              routeName: p.path === '/' ? 'plugin_page' : 'plugin_subpage',
              params: {
                pluginId: plugin.id,
                page: p.path === '/' ? undefined : p.path.replace(/^\//, ''),
              },
              active:
                page?.route?.startsWith('plugin_') &&
                page.params?.pluginId === plugin.id &&
                (p.path === '/'
                  ? !page.params?.page
                  : page.params?.page === p.path.replace(/^\//, '')),
            })),
          });
        }
      }
    });

    return groups;
  }, [collections, plugins, page?.route, page?.params?.pluginId, page?.params?.page]);

  return (
    <Sidebar collapsible="icon" variant={variant}>
      <SidebarHeader className="flex flex-row items-center px-4 py-6 gap-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center transition-[padding,justify-content]">
        <Tooltip>
          <TooltipTrigger
            render={
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0 shadow-sm cursor-pointer" />
            }
          >
            <SparklesIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="group-data-[collapsible=expanded]:hidden"
          >
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
                onClick={() => navigate('home')}
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
                            item.active !== undefined
                              ? item.active
                              : page?.route === item.routeName
                          }
                          onClick={() => navigate(item.routeName, item.params)}
                          tooltip={item.label}
                        >
                          {typeof item.icon === 'string' ? (
                            <Icon name={item.icon as IconName} />
                          ) : (
                            <item.icon />
                          )}
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
            <TooltipTrigger
              render={
                <Avatar className="size-12 rounded-lg shrink-0 cursor-pointer" />
              }
            >
              <AvatarFallback className="text-[10px] font-semibold">
                {auth.user?.email.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="group-data-[collapsible=expanded]:hidden"
            >
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
              <SidebarMenuButton
                size="sm"
                onClick={() => logout()}
                tooltip="Sign out"
                className="text-muted-foreground/50 hover:text-destructive"
              >
                <LogOutIcon />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="group-data-[collapsible=icon]:block hidden">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="sm"
                  onClick={() => logout()}
                  tooltip="Sign out"
                  className="text-muted-foreground/50 hover:text-destructive"
                >
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
