import {
  type D1Database,
  type KVNamespace,
  type Fetcher,
} from '@cloudflare/workers-types';
import type { PluginManager } from './plugins';

export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
  FLARE_ENCRYPTION_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  LOADER?: any;
  R2_PLUGINS?: any;
};

export type Variables = {
  user: any;
  scopes: string[];
  reservedSlugs: string[];
  pluginManager: PluginManager;
};
