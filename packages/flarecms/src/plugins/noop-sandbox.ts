import type { SandboxRunner, SandboxedPlugin, PluginManifest } from './types';

/**
 * Error thrown when a sandboxed operation is attempted but no sandbox runner is available.
 */
export class SandboxNotAvailableError extends Error {
	constructor(reason: string = 'Cloudflare Worker Loader is not configured or available.') {
		super(`Plugin Sandbox is not available: ${reason}`);
		this.name = 'SandboxNotAvailableError';
	}
}

/**
 * No-op Sandbox Runner
 *
 * Acts as a fallback for environments where sandboxing (e.g. Worker Loader)
 * is not supported or configured.
 */
export class NoopSandboxRunner implements SandboxRunner {
	isAvailable(): boolean {
		return false;
	}

	async load(_manifest: PluginManifest, _code: string): Promise<SandboxedPlugin> {
		throw new SandboxNotAvailableError();
	}

	async terminateAll(): Promise<void> {
		// No-op
	}
}
