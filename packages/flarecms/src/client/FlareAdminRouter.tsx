import React, { useEffect } from 'react';
import App from './app';
import { setBase, setApiBaseUrl } from './store/config';
import { initRouter } from './store/router';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

export interface FlareAdminProps {
  /**
   * The base path where the admin UI is mounted.
   * @default "/admin"
   */
  basePath?: string;
  
  /**
   * The base URL for FlareCMS API calls.
   * @default "/api"
   */
  apiBaseUrl?: string;
}

/**
 * FlareAdminRouter is the main entry point for the FlareCMS Admin UI.
 * It manages the routing and state for the entire administrative dashboard.
 * 
 * @example
 * <FlareAdminRouter basePath="/admin" apiBaseUrl="/api/flarecms" />
 */
export function FlareAdminRouter({ 
  basePath = '/admin', 
  apiBaseUrl = '/api' 
}: FlareAdminProps) {
  
  // Initialize configuration stores and router
  useEffect(() => {
    setBase(basePath);
    setApiBaseUrl(apiBaseUrl);
    initRouter(basePath);
  }, [basePath, apiBaseUrl]);

  return (
    <div className="flare-admin">
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </div>
  );
}
