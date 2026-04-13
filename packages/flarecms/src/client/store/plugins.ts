import { createFetcherStore } from './fetcher';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  routes: string[];
  pages?: Array<{ path: string; label?: string; icon?: string }>;
  adminWidgets?: Array<{ id: string; title?: string; size?: string }>;
}

/**
 * Store for active plugins list
 */
export const $plugins = createFetcherStore<PluginManifest[]>(['/plugins']);
