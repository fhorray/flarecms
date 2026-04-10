import { registerPluginBlock } from 'flarecms/client';
import { TesterComponent } from './tester-component';

/**
 * Client-side entrypoint for the UI Kit Tester plugin.
 *
 * Registers custom React components with the FlareCMS block registry
 * so they can be rendered in the admin dashboard.
 */
export function registerTesterBlocks() {
  registerPluginBlock('tester-component', TesterComponent);
}

// Auto-register if this is imported as a side-effect
registerTesterBlocks();
