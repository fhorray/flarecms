import type { PluginCapability, SerializedRequest } from '../types.js';

/**
 * Interface for the Cloudflare Worker Loader API.
 */
export interface WorkerLoader {
	get(id: string, configFactory: () => WorkerLoaderConfig): WorkerStub;
}

/**
 * Configuration for a dynamic worker.
 */
export interface WorkerLoaderConfig {
	compatibilityDate?: string;
	compatibilityFlags?: string[];
	mainModule: string;
	modules: Record<string, { js: string } | { text: string } | { data: ArrayBuffer }>;
	env?: Record<string, any>;
	limits?: {
		cpuMs?: number;
		subRequests?: number;
	};
}

/**
 * A stub for interacting with a dynamic worker.
 */
export interface WorkerStub {
	fetch(request: Request | string, init?: RequestInit): Promise<Response>;
	get(pluginId: string): any; // For RPC calls if supported via Entrypoints
}

/**
 * Metadata passed to the PluginBridge when it's instantiated.
 */
export interface PluginBridgeProps {
	pluginId: string;
	version: string;
	capabilities: PluginCapability[];
	allowedHosts: string[];
	storageCollections: string[];
}

/**
 * Typing for the environment available to the PluginBridge.
 */
export interface PluginBridgeEnv {
	DB: any; // FlareDb (D1Database)
	KV: any; // KVNamespace
}

/**
 * The RPC interface exposed by the PluginBridge.
 */
export interface PluginBridgeInterface {
	// KV
	kvGet(key: string): Promise<any>;
	kvSet(key: string, value: any): Promise<void>;
	kvDelete(key: string): Promise<boolean>;
	kvList(prefix?: string): Promise<any[]>;

	// Storage
	storageGet(collection: string, id: string): Promise<any>;
	storagePut(collection: string, id: string, data: any): Promise<void>;
	storageDelete(collection: string, id: string): Promise<boolean>;
	storageQuery(collection: string, opts?: any): Promise<any>;

	// Content
	contentGet(collection: string, id: string): Promise<any>;
	contentList(collection: string, opts?: any): Promise<any>;
	contentCreate(collection: string, data: any): Promise<any>;
	contentUpdate(collection: string, id: string, data: any): Promise<any>;
	contentDelete(collection: string, id: string): Promise<boolean>;

	// HTTP
	httpFetch(url: string, init?: any): Promise<any>;

	// Log
	log(level: string, message: string, data?: any): void;
}
