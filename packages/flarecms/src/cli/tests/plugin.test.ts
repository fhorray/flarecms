import { describe, it, expect, mock, afterAll } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPluginCommand } from '../commands.ts';

/**
 * CLI: createPluginCommand Tests
 */

// 1. Mock @clack/prompts
mock.module('@clack/prompts', () => ({
  intro: () => { },
  outro: () => { },
  text: async () => 'test-plugin',
  spinner: () => ({
    start: () => { },
    stop: () => { }
  }),
  note: () => { },
  cancel: () => { },
  isCancel: (val: any) => val === null,
  log: {
    info: () => { },
    warn: () => { },
    error: (msg: string) => console.log('Log Error:', msg),
  }
}));

describe('CLI: createPluginCommand', () => {
  const rootDir = process.cwd();
  const targetPlugin = resolve(rootDir, 'plugins', 'test-plugin');
  const targetPlayground = resolve(rootDir, 'apps', 'test-plugin-playground');

  afterAll(() => {
    // Cleanup generated folders
    if (existsSync(targetPlugin)) {
      rmSync(targetPlugin, { recursive: true, force: true });
    }
    if (existsSync(targetPlayground)) {
      rmSync(targetPlayground, { recursive: true, force: true });
    }
  });

  it('should generate a plugin and playground with correct placeholders', async () => {
    // Mock process.exit
    const exitSpy = mock(() => { });
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = exitSpy;

    await createPluginCommand();

    // 1. Verify Directories
    expect(existsSync(targetPlugin)).toBe(true);
    expect(existsSync(targetPlayground)).toBe(true);

    // 2. Verify Plugin package.json
    const pluginPkg = JSON.parse(readFileSync(resolve(targetPlugin, 'package.json'), 'utf-8'));
    expect(pluginPkg.name).toBe('@flarecms/plugin-test-plugin');

    // 3. Verify Plugin src/index.ts
    const pluginIndex = readFileSync(resolve(targetPlugin, 'src', 'index.ts'), 'utf-8');
    expect(pluginIndex).toContain("id: 'test-plugin'");
    expect(pluginIndex).toContain("name: 'Test Plugin'");

    // 4. Verify Playground package.json
    const playgroundPkg = JSON.parse(readFileSync(resolve(targetPlayground, 'package.json'), 'utf-8'));
    expect(playgroundPkg.name).toBe('test-plugin-playground');
    expect(playgroundPkg.dependencies['@flarecms/plugin-test-plugin']).toBe('workspace:*');

    // 5. Verify Playground src/index.ts (Backend)
    const playgroundIndex = readFileSync(resolve(targetPlayground, 'src', 'index.ts'), 'utf-8');
    expect(playgroundIndex).toContain("import myPlugin from '@flarecms/plugin-test-plugin'");

    // Restore process.exit
    process.exit = originalExit;
    expect(exitSpy).not.toHaveBeenCalled();
  }, 10000); // 10s timeout for file operations

  it('should fail if folders already exist', async () => {
    // Mock process.exit
    const exitSpy = mock(() => { });
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = exitSpy;

    // Run again - should fail because folders exist from previous test
    await createPluginCommand();

    // Check if exit was called or error logged (in our case we log error and exit)
    expect(exitSpy).toHaveBeenCalled();

    process.exit = originalExit;
  });
});
