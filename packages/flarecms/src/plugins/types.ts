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
  | 'email:send'
  | 'crypto:encrypt'
  | 'crypto:decrypt'
  | 'storage:read'
  | 'storage:write'
  | 'storage:delete'
  | 'storage:list';

export interface FlarePluginDefinition {
  /**
   * Plugin ID.
   */
  id?: string;
  /**
   * Plugin name.
   */
  name?: string;
  /**
   * Plugin version.
   */
  version?: string;
  /**
   * Plugin format.
   */
  format?: 'standard';
  /**
   * Plugin capabilities.
   */
  capabilities?: PluginCapability[];
  /**
   * Allowed hosts for the plugin.
   */
  allowedHosts?: string[];
  /**
   * Storage collections for the plugin.
   * The key is the collection name and the value is an object with indexes.
   */
  storage?: Record<string, { indexes?: string[] }>;
  /**
   * Admin pages for the plugin.
   * The key is the path and the value is an object with the page configuration.
   */
  adminPages?: Array<{ path: string; label: string; icon?: string }>;
  /**
   * Admin widgets for the plugin.
   * The key is the id and the value is an object with the widget configuration.
   */
  adminWidgets?: Array<{ id: string; title?: string; size?: 'full' | 'half' | 'third' }>;

  /**
   * Hooks for the plugin.
   * The key is the hook name and the value is the hook handler.
   */
  hooks?: Record<string, FlareHookEntry>;
  /**
   * Routes for the plugin.
   * The key is the route name and the value is the route handler.
   */
  routes?: Record<string, FlareRouteEntry>;
  /**
   * Admin handler for the plugin.
   * The key is the admin handler and the value is the admin handler.
   */
  admin?: {
    handler: (interaction: BlockInteraction, ctx: PluginContext) => Promise<BlockResponse>;
  };
}

/**
 * A complete, self-contained FlareCMS plugin.
 */
export type FlarePlugin = FlarePluginDefinition & {
  id: string;
  version: string;
};

// ── Block Kit Types ──

/**
 * Block types for the plugin.
 */
export type BlockType =
  | 'header' | 'text' | 'divider' | 'stat' | 'input' | 'textarea' | 'select' | 'toggle'
  | 'button' | 'button_group' | 'table' | 'alert' | 'card' | 'grid' | 'form' | 'custom';

/**
 * Block interface for the plugin.
 */
export interface Block {
  type: BlockType;
  id?: string;
  className?: string;
  [key: string]: unknown;
}

/**
 * Block interaction types for the plugin.
 */
export type BlockInteraction =
  | { type: 'page_load'; page: string }
  | { type: 'block_action'; blockId: string; value?: unknown }
  | { type: 'form_submit'; formId: string; values: Record<string, unknown> };

/**
 * Block response for the plugin.
 */
export interface BlockResponse {
  blocks: Block[];
  toast?: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  };
}

/**
 * Flare hook handler for the plugin.
 */
export type FlareHookHandler = (event: unknown, ctx: PluginContext) => Promise<unknown>;

/**
 * Flare hook entry for the plugin.
 */
export type FlareHookEntry =
  | FlareHookHandler
  | {
    handler: FlareHookHandler;
    priority?: number;
    timeout?: number;
  };

/**
 * Flare route entry for the plugin.
 */
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
  /**
   * Plugin id and version.
   */
  plugin: { id: string; version: string };
  /**
   * KV storage for the plugin.
   */
  kv: PluginKV;
  /**
   * Storage collections for the plugin.
   */
  storage: Record<string, PluginStorageCollection>;
  /**
   * Content access for the plugin.
   */
  content?: PluginContentAccess;
  /**
   * Media access for the plugin.
   */
  media?: PluginMediaAccess;
  /**
   * HTTP access for the plugin.
   */
  http?: PluginHttpAccess;
  /**
   * Logger for the plugin.
   */
  log: PluginLogger;
  /**
   * Site information for the plugin.
   */
  site: { name: string; url: string; locale: string };
  /**
   * Users access for the plugin.
   */
  users?: PluginUsersAccess;
  /**
   * Email access for the plugin.
   */
  email?: PluginEmailAccess;
  /**
   * Crypto access for the plugin.
   */
  crypto?: PluginCryptoAccess;
}

/**
 * Plugin Descriptor used in the host configuration.
 */
export interface PluginDescriptor {
  /**
   * Plugin id.
   */
  id: string;
  /**
   * Plugin name.
   */
  name?: string;
  /**
   * Plugin version.
   */
  version: string;
  /**
   * Plugin format.
   */
  format: 'standard';
  /**
   * Plugin entrypoint.
   */
  entrypoint: string;
  /**
   * Plugin capabilities.
   */
  capabilities?: PluginCapability[];
  /**
   * Allowed hosts for the plugin.
   */
  allowedHosts?: string[];
  /**
   * Storage collections for the plugin.
   */
  storage?: Record<string, { indexes?: string[] }>;
  /**
   * Admin pages for the plugin.
   */
  adminPages?: Array<{ path: string; label: string; icon?: string }>;
  /**
   * Admin widgets for the plugin.
   */
  adminWidgets?: Array<{ id: string; title?: string; size?: 'full' | 'half' | 'third' }>;
}

/**
 * Manifest describing an installed plugin's requirements and structure.
 */
export interface PluginManifest {
  /**
   * Plugin id.
   */
  id: string;
  /**
   * Plugin name.
   */
  name: string;
  /**
   * Plugin version.
   */
  version: string;
  /**
   * Plugin capabilities.
   */
  capabilities: PluginCapability[];
  /**
   * Allowed hosts for the plugin.
   */
  allowedHosts: string[];
  /**
   * Storage collections for the plugin.
   */
  storage: Record<string, { indexes: string[] }>;
  /**
   * Hooks for the plugin.
   */
  hooks: string[];
  /**
   * Routes for the plugin.
   */
  routes: string[];
  /**
   * Admin pages for the plugin.
   */
  adminPages: Array<{ path: string; label: string; icon?: string }>;
  /**
   * Admin widgets for the plugin.
   */
  adminWidgets: Array<{ id: string; title?: string; size?: string }>;
}

/**
 * Internal representation of a plugin after registration and normalization.
 */
export interface ResolvedPlugin {
  /**
   * Plugin id.
   */
  id: string;
  /**
   * Plugin name.
   */
  name: string;
  /**
   * Plugin version.
   */
  version: string;
  /**
   * Plugin capabilities.
   */
  capabilities: PluginCapability[];
  /**
   * Allowed hosts for the plugin.
   */
  allowedHosts: string[];
  /**
   * Storage collections for the plugin.
   */
  storage: Record<string, { indexes: string[] }>;
  /**
   * Hooks for the plugin.
   */
  hooks: Record<string, ResolvedHook>;
  /**
   * Routes for the plugin.
   */
  routes: Record<string, ResolvedRoute>;
  /**
   * Admin handler for the plugin.
   */
  admin?: {
    handler: (interaction: BlockInteraction, ctx: PluginContext) => Promise<BlockResponse>;
  };
  /**
   * Admin pages for the plugin.
   */
  adminPages: Array<{ path: string; label: string; icon?: string }>;
  /**
   * Admin widgets for the plugin.
   */
  adminWidgets: Array<{ id: string; title?: string; size?: 'full' | 'half' | 'third' }>;
}

/**
 * Resolved hook for the plugin.
 */
export interface ResolvedHook {
  /**
   * Hook priority.
   */
  priority: number;
  /**
   * Hook timeout.
   */
  timeout: number;
  /**
   * Hook handler.
   */
  handler: FlareHookHandler;
  /**
   * Plugin id.
   */
  pluginId: string;
}

/**
 * Resolved route for the plugin.
 */
export interface ResolvedRoute {
  /**
   * Route input.
   */
  input?: unknown;
  /**
   * Route public.
   */
  public?: boolean;
  /**
   * Route handler.
   */
  handler: (routeCtx: RouteCtx, ctx: PluginContext) => Promise<unknown>;
}

// ── Sandbox Runner Interfaces ──

/**
 * Sandbox runner for the plugin.
 */
export interface SandboxRunner {
  /**
   * Check if the sandbox is available.
   */
  isAvailable(): boolean;
  /**
   * Load the plugin in the sandbox.
   */
  load(manifest: PluginManifest, code: string): Promise<SandboxedPlugin>;
  /**
   * Terminate all sandboxes.
   */
  terminateAll(): Promise<void>;
}

/**
 * Sandboxed plugin for the plugin.
 */
export interface SandboxedPlugin {
  /**
   * Plugin id.
   */
  readonly id: string;
  /**
   * Invoke hook for the plugin.
   */
  invokeHook(hookName: string, event: unknown): Promise<unknown>;
  /**
   * Invoke route for the plugin.
   */
  invokeRoute(routeName: string, input: unknown, request: SerializedRequest): Promise<unknown>;
  /**
   * Terminate the plugin.
   */
  terminate(): Promise<void>;
}

/**
 * Sandbox options for the plugin.
 */
export interface SandboxOptions {
  /**
   * Database for the plugin.
   */
  db: FlareDb;
  /**
   * Resource limits for the plugin.
   */
  limits?: ResourceLimits;
  /**
   * Site information for the plugin.
   */
  siteInfo?: { name: string; url: string; locale: string };
  encryptionSecret?: string;
}

/**
 * Resource limits for the plugin.
 */
export interface ResourceLimits {
  /**
   * CPU time limit in milliseconds.
   */
  cpuMs?: number;
  /**
   * Memory limit in megabytes.
   */
  memoryMb?: number;
  /**
   * Subrequest limit.
   */
  subrequests?: number;
  /**
   * Wall time limit in milliseconds.
   */
  wallTimeMs?: number;
}

// ── Context Sub-Interfaces ──

/**
 * Plugin KV for the plugin.
 */
export interface PluginKV {
  /**
   * Get a value from the KV store.
   */
  get(key: string): Promise<unknown>;
  /**
   * Set a value in the KV store.
   */
  set(key: string, value: unknown): Promise<void>;
  /**
   * Delete a value from the KV store.
   */
  delete(key: string): Promise<boolean>;
  /**
   * List all values in the KV store.
   */
  list(prefix?: string): Promise<Array<{ key: string; value: unknown }>>;
}

/**
 * Plugin storage collection for the plugin.
 */
export interface PluginStorageCollection {
  /**
   * Get a value from the storage collection.
   */
  get(id: string): Promise<unknown>;
  /**
   * Put a value in the storage collection.
   */
  put(id: string, data: unknown): Promise<void>;
  /**
   * Delete a value from the storage collection.
   */
  delete(id: string): Promise<boolean>;
  /**
   * Query the storage collection.
   */
  query(opts?: { limit?: number; cursor?: string }): Promise<{ items: unknown[]; hasMore: boolean; cursor?: string }>;
  /**
   * Count the number of items in the storage collection.
   */
  count(): Promise<number>;
}

/**
 * Plugin content access for the plugin.
 */
export interface PluginContentAccess {
  /**
   * Get a value from the content collection.
   */
  get(collection: string, id: string): Promise<unknown>;
  /**
   * List all values in the content collection.
   */
  list(collection: string, opts?: { limit?: number; cursor?: string }): Promise<{ items: unknown[]; hasMore: boolean }>;
  /**
   * Create a new value in the content collection.
   */
  create(collection: string, data: Record<string, unknown>): Promise<unknown>;
  /**
   * Update a value in the content collection.
   */
  update(collection: string, id: string, data: Record<string, unknown>): Promise<unknown>;
  /**
   * Delete a value from the content collection.
   */
  delete(collection: string, id: string): Promise<boolean>;
}

/**
 * Plugin media access for the plugin.
 */
export interface PluginMediaAccess {
  /**
   * Get a value from the media collection.
   */
  get(id: string): Promise<unknown>;
  /**
   * List all values in the media collection.
   */
  list(opts?: { limit?: number }): Promise<{ items: unknown[] }>;
  /**
   * Delete a value from the media collection.
   */
  delete(id: string): Promise<boolean>;
}

/**
 * Plugin HTTP access for the plugin.
 */
export interface PluginHttpAccess {
  /**
   * Fetch a resource from the HTTP.
   */
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

/**
 * Plugin logger for the plugin.
 */
export interface PluginLogger {
  /**
   * Log a debug message.
   */
  debug(msg: string, data?: unknown): void;
  /**
   * Log an info message.
   */
  info(msg: string, data?: unknown): void;
  /**
   * Log a warning message.
   */
  warn(msg: string, data?: unknown): void;
  /**
   * Log an error message.
   */
  error(msg: string, data?: unknown): void;
}

/**
 * Plugin users access for the plugin.
 */
export interface PluginUsersAccess {
  /**
   * Get a user from the users collection.
   */
  get(id: string): Promise<unknown>;
  /**
   * List all users in the users collection.
   */
  list(opts?: { limit?: number }): Promise<{ items: unknown[] }>;
}

/**
 * Plugin email access for the plugin.
 */
export interface PluginEmailAccess {
  /**
   * Send an email.
   */
  send(message: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}

/**
 * Plugin crypto access for the plugin.
 */
export interface PluginCryptoAccess {
  /**
   * Encrypt a string using the system's secret key.
   */
  encrypt(text: string): Promise<string>;
  /**
   * Decrypt a string using the system's secret key.
   */
  decrypt(ciphertext: string): Promise<string>;
}

// ── Request Serialization ──

/**
 * Serialized request for the plugin.
 */
export interface SerializedRequest {
  /**
   * Request url.
   */
  url: string;
  /**
   * Request method.
   */
  method: string;
  /**
   * Request headers.
   */
  headers: Record<string, string>;
  /**
   * Request meta.
   */
  meta: RequestMeta;
}

/**
 * Request meta for the plugin.
 */
export interface RequestMeta {
  /**
   * Request ip.
   */
  ip: string | null;
  /**
   * Request user agent.
   */
  userAgent: string | null;
  /**
   * Request referer.
   */
  referer: string | null;
}

/**
 * Sandbox runner factory for the plugin.
 */
export type SandboxRunnerFactory = (options: SandboxOptions) => SandboxRunner;
