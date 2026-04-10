import type { Headers } from '@cloudflare/workers-types';
import type { FlareDb } from '../db';

/**
 * Available capabilities for FlareCMS plugins.
 * These define what a plugin is allowed to access and do.
 */
export type PluginCapability =
  | 'read:content'
  | 'write:content'
  | 'read:media'
  | 'write:media'
  | 'network:fetch'
  | 'network:fetch:any'
  | 'read:users'
  | 'email:send';

/**
 * Standard plugin definition format.
 * This is the identity format returned by definePlugin().
 */
export interface FlarePluginDefinition {
  hooks?: Record<string, FlareHookEntry>;
  routes?: Record<string, FlareRouteEntry>;
}

export type FlareHookHandler = (event: unknown, ctx: PluginContext) => Promise<unknown>;

export type FlareHookEntry =
  | FlareHookHandler
  | {
      handler: FlareHookHandler;
      priority?: number;
      timeout?: number;
    };

export interface FlareRouteEntry {
  handler: (routeCtx: RouteCtx, ctx: PluginContext) => Promise<unknown>;
  input?: unknown; // Can be a Zod schema or generic type
  public?: boolean;
}

/**
 * Context provided to route handlers.
 */
export interface RouteCtx {
  input: unknown;
  request: SerializedRequest;
  requestMeta: RequestMeta;
}

/**
 * Core context provided to all plugin hooks and routes.
 * Access is gated by the plugin's declared capabilities.
 */
export interface PluginContext {
  plugin: { id: string; version: string };
  kv: PluginKV;
  storage: Record<string, PluginStorageCollection>;
  content?: PluginContentAccess;
  media?: PluginMediaAccess;
  http?: PluginHttpAccess;
  log: PluginLogger;
  site: { name: string; url: string; locale: string };
  users?: PluginUsersAccess;
  email?: PluginEmailAccess;
}

/**
 * Plugin Descriptor used in the host configuration.
 */
export interface PluginDescriptor {
  id: string;
  version: string;
  format: 'standard';
  entrypoint: string; // Module identifier for the plugin backend
  capabilities?: PluginCapability[];
  allowedHosts?: string[];
  storage?: Record<string, { indexes?: string[] }>;
  adminPages?: Array<{ path: string; label: string; icon?: string }>;
}

/**
 * Manifest describing an installed plugin's requirements and structure.
 */
export interface PluginManifest {
  id: string;
  version: string;
  capabilities: PluginCapability[];
  allowedHosts: string[];
  storage: Record<string, { indexes: string[] }>;
  hooks: string[];
  routes: string[];
}

/**
 * Internal representation of a plugin after registration and normalization.
 */
export interface ResolvedPlugin {
  id: string;
  version: string;
  capabilities: PluginCapability[];
  allowedHosts: string[];
  storage: Record<string, { indexes: string[] }>;
  hooks: Record<string, ResolvedHook>;
  routes: Record<string, ResolvedRoute>;
}

export interface ResolvedHook {
  priority: number;
  timeout: number;
  handler: FlareHookHandler;
  pluginId: string;
}

export interface ResolvedRoute {
  input?: unknown;
  public?: boolean;
  handler: (routeCtx: RouteCtx, ctx: PluginContext) => Promise<unknown>;
}

// ── Sandbox Runner Interfaces ──

export interface SandboxRunner {
  isAvailable(): boolean;
  load(manifest: PluginManifest, code: string): Promise<SandboxedPlugin>;
  terminateAll(): Promise<void>;
}

export interface SandboxedPlugin {
  readonly id: string;
  invokeHook(hookName: string, event: unknown): Promise<unknown>;
  invokeRoute(routeName: string, input: unknown, request: SerializedRequest): Promise<unknown>;
  terminate(): Promise<void>;
}

export interface SandboxOptions {
  db: FlareDb;
  limits?: ResourceLimits;
  siteInfo?: { name: string; url: string; locale: string };
}

export interface ResourceLimits {
  cpuMs?: number;
  memoryMb?: number;
  subrequests?: number;
  wallTimeMs?: number;
}

// ── Context Sub-Interfaces ──

export interface PluginKV {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(prefix?: string): Promise<Array<{ key: string; value: unknown }>>;
}

export interface PluginStorageCollection {
  get(id: string): Promise<unknown>;
  put(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<boolean>;
  query(opts?: { limit?: number; cursor?: string }): Promise<{ items: unknown[]; hasMore: boolean; cursor?: string }>;
  count(): Promise<number>;
}

export interface PluginContentAccess {
  get(collection: string, id: string): Promise<unknown>;
  list(collection: string, opts?: { limit?: number; cursor?: string }): Promise<{ items: unknown[]; hasMore: boolean }>;
  create(collection: string, data: Record<string, unknown>): Promise<unknown>;
  update(collection: string, id: string, data: Record<string, unknown>): Promise<unknown>;
  delete(collection: string, id: string): Promise<boolean>;
}

export interface PluginMediaAccess {
  get(id: string): Promise<unknown>;
  list(opts?: { limit?: number }): Promise<{ items: unknown[] }>;
  delete(id: string): Promise<boolean>;
}

export interface PluginHttpAccess {
  fetch(
    url: string,
    init?: RequestInit
  ): Promise<{
    status: number;
    ok: boolean;
    headers: Headers;
    text(): Promise<string>;
    json(): Promise<unknown>;
  }>;
}

export interface PluginLogger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export interface PluginUsersAccess {
  get(id: string): Promise<unknown>;
  list(opts?: { limit?: number }): Promise<{ items: unknown[] }>;
}

export interface PluginEmailAccess {
  send(message: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}

// ── Request Serialization ──

export interface SerializedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  meta: RequestMeta;
}

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
}

export type SandboxRunnerFactory = (options: SandboxOptions) => SandboxRunner;
