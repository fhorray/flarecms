import type {
	SandboxRunner,
	SandboxedPlugin,
	PluginManifest,
	SandboxOptions,
	SerializedRequest,
} from '../types.js';
import type { WorkerLoader, WorkerStub, PluginBridgeProps } from './types.js';
import { generatePluginWrapper } from './wrapper.js';
import { PluginBridge } from './bridge.js';

/**
 * Sandboxed Plugin instance running in a Cloudflare Worker Isolate.
 */
class CloudflareSandboxedPlugin implements SandboxedPlugin {
	constructor(
		public readonly id: string,
		private stub: any,
	) {}

	async invokeHook(hookName: string, event: unknown): Promise<unknown> {
		return await this.stub.invokeHook(hookName, event);
	}

	async invokeRoute(routeName: string, input: unknown, request: SerializedRequest): Promise<unknown> {
		return await this.stub.invokeRoute(routeName, input, request);
	}

	async terminate(): Promise<void> {
		// Worker Loader handles termination automatically when the stub is GC'd
		// or when the parent worker terminates.
	}
}

/**
 * Sandbox Runner implementation for Cloudflare Workers.
 * Uses the dynamic 'Worker Loader' API to spawn V8 isolates.
 */
export class CloudflareSandboxRunner implements SandboxRunner {
	private loader: WorkerLoader;
	private options: SandboxOptions;

	constructor(loader: WorkerLoader, options: SandboxOptions) {
		this.loader = loader;
		this.options = options;
	}

	isAvailable(): boolean {
		return !!this.loader;
	}

	async load(manifest: PluginManifest, code: string): Promise<SandboxedPlugin> {
		const wrapperCode = generatePluginWrapper(manifest);

		const props: PluginBridgeProps = {
			pluginId: manifest.id,
			version: manifest.version,
			capabilities: manifest.capabilities,
			allowedHosts: manifest.allowedHosts,
			storageCollections: Object.keys(manifest.storage),
		};

		// Create the bridge service binding
		const bridgeBinding = (PluginBridge as any).asServiceBinding({
			props,
			env: {
				DB: (this.options.db as any).dialect.config.database,
				KV: (this.options as any).kv, // Assuming kv is passed in options
			},
		});

		// Spawn the dynamic worker
		const stub = this.loader.get(manifest.id, () => ({
			compatibilityDate: '2024-04-01',
			mainModule: 'plugin.js',
			modules: {
				'plugin.js': { js: wrapperCode },
				'sandbox-plugin.js': { js: code },
			},
			env: {
				PLUGIN_ID: manifest.id,
				PLUGIN_VERSION: manifest.version,
				BRIDGE: bridgeBinding,
				SITE_INFO: this.options.siteInfo,
			},
			limits: {
				cpuMs: this.options.limits?.cpuMs ?? 50,
				subRequests: this.options.limits?.subrequests ?? 10,
			},
		}));

		return new CloudflareSandboxedPlugin(manifest.id, stub);
	}

	async terminateAll(): Promise<void> {
		// Not explicitly supported via Worker Loader API - workers are ephemeral
	}
}
