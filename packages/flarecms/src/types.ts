import {
  type D1Database,
  type KVNamespace,
  type Fetcher,
} from '@cloudflare/workers-types';

export type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export type Variables = {
  user: any;
  scopes: string[];
  reservedSlugs: string[];
};
