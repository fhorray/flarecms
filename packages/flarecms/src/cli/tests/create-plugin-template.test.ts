import { describe, it, expect, mock, afterAll } from 'bun:test';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProjectCommand } from '../commands.ts';

let mockTemplatesMissing = false;

// 1. Mock node:fs globally for this test file
mock.module('node:fs', () => {
  const fs = import.meta.require('node:fs');
  return {
    ...fs,
    existsSync: (path: string) => {
      if (mockTemplatesMissing && path.includes('templates/plugin-development')) {
        return false;
      }
      return fs.existsSync(path);
    }
  };
});

// 2. Mock @clack/prompts
let currentProjectName = 'test-plugin-workspace';
mock.module('@clack/prompts', () => ({
  intro: () => { },
  outro: () => { },
  text: async () => currentProjectName,
  select: async () => 'plugin-development',
  confirm: async () => true,
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
    error: () => { },
  }
}));

// 3. Mock giget
mock.module('giget', () => ({
  downloadTemplate: async (source: string, opts: any) => {
    // Simulate giget by copying from local repo to the destination
    // This allows us to test the "Remote Flow" logic as if it was giget
    const fs = import.meta.require('node:fs');
    const path = import.meta.require('node:path');
    
    // Find the real template path in the monorepo root
    const repoTemplatesRoot = path.resolve(process.cwd(), '../../templates/plugin-development');
    const subFolder = source.split('/').pop();
    const srcPath = path.resolve(repoTemplatesRoot, subFolder);
    
    fs.cpSync(srcPath, opts.dir, { recursive: true });
    return { dir: opts.dir };
  }
}));

describe('CLI: createProjectCommand (Plugin Template)', () => {
  const testDir = resolve(process.cwd(), 'test-plugin-workspace');

  afterAll(() => {
    mockTemplatesMissing = false;
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create a workspace structure for plugin-development (Local Flow)', async () => {
    mockTemplatesMissing = false;
    currentProjectName = 'test-plugin-workspace';
    
    // Mock process.exit
    const exitSpy = mock(() => { });
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = exitSpy;

    await createProjectCommand();

    // Verify directory structure
    expect(existsSync(testDir)).toBe(true);
    expect(existsSync(resolve(testDir, 'playground'))).toBe(true);
    expect(existsSync(resolve(testDir, 'starter-plugin'))).toBe(true);

    // Verify Plugin source code (PLACEHOLDER CHECK)
    const pluginSrc = readFileSync(resolve(testDir, 'starter-plugin/src/index.ts'), 'utf-8');
    expect(pluginSrc).not.toContain('{{');
    expect(pluginSrc).toContain("name: 'Test Plugin Workspace'");

    // Verify Playground source code (MODULAR PATTERN CHECK)
    const playgroundSrc = readFileSync(resolve(testDir, 'playground/src/index.ts'), 'utf-8');
    expect(playgroundSrc).not.toContain('{{');
    expect(playgroundSrc).toContain("import { createFlareAPI } from 'flarecms/server'");
    expect(playgroundSrc).toContain("app.route('/api', createFlareAPI({");
    expect(playgroundSrc).toContain("if (url.pathname.includes('.') || url.pathname.startsWith('/@'))");

    // Verify Playground client (FRONTEND ALIGNMENT CHECK)
    const playgroundClient = readFileSync(resolve(testDir, 'playground/src/client.tsx'), 'utf-8');
    expect(playgroundClient).toContain('<FlareAdminRouter basePath="/admin" apiBaseUrl="/api" />');
    expect(playgroundClient).toContain("import 'flarecms/style.css'");

    // Restore process.exit
    process.exit = originalExit;
  }, 15000);

  it('should create a plugin project using remote flow (Simulated Giget)', async () => {
    mockTemplatesMissing = true;
    currentProjectName = 'test-prod-plugin';
    
    const testProdDir = resolve(process.cwd(), 'test-prod-plugin');
    if (existsSync(testProdDir)) rmSync(testProdDir, { recursive: true, force: true });

    try {
      await createProjectCommand();

      // Verify structure is flat and correctly patched
      expect(existsSync(resolve(testProdDir, 'playground/src/index.ts'))).toBe(true);
      expect(existsSync(resolve(testProdDir, 'starter-plugin/src/index.ts'))).toBe(true);
      
      const srcContent = readFileSync(resolve(testProdDir, 'starter-plugin/src/index.ts'), 'utf-8');
      expect(srcContent).not.toContain('{{');
      expect(srcContent).toContain("name: 'Test Prod Plugin'");
      
      const pkgContent = readFileSync(resolve(testProdDir, 'playground/package.json'), 'utf-8');
      expect(pkgContent).toContain('"flarecms": "latest"');

      // Verify wrangler.jsonc (INFRASTRUCTURE CHECK)
      const wranglerContent = readFileSync(resolve(testProdDir, 'playground/wrangler.jsonc'), 'utf-8');
      expect(wranglerContent).toContain('"name": "test-prod-plugin-playground"');
    } finally {
      if (existsSync(testProdDir)) rmSync(testProdDir, { recursive: true, force: true });
      mockTemplatesMissing = false;
    }
  }, 15000);

  it('should create an individual plugin using createPluginCommand (Monorepo Flow)', async () => {
    mockTemplatesMissing = false;
    currentProjectName = 'my-new-plugin';
    const { createPluginCommand } = await import('../commands.ts');

    // Setup: simulate being in a directory where we want to create plugins/ and apps/
    const monorepoTestDir = resolve(process.cwd(), 'test-monorepo-sim');
    if (existsSync(monorepoTestDir)) rmSync(monorepoTestDir, { recursive: true, force: true });
    mkdirSync(monorepoTestDir, { recursive: true });

    const originalCwd = process.cwd();
    process.chdir(monorepoTestDir);

    try {
      await createPluginCommand();

      // Verify monorepo structure
      expect(existsSync(resolve(monorepoTestDir, 'plugins/my-new-plugin'))).toBe(true);
      expect(existsSync(resolve(monorepoTestDir, 'apps/my-new-plugin-playground'))).toBe(true);

      // Verify patching
      const pluginSrc = readFileSync(resolve(monorepoTestDir, 'plugins/my-new-plugin/src/index.ts'), 'utf-8');
      expect(pluginSrc).not.toContain('{{');
      expect(pluginSrc).toContain("name: 'My New Plugin'");

      const playgroundPkg = JSON.parse(readFileSync(resolve(monorepoTestDir, 'apps/my-new-plugin-playground/package.json'), 'utf-8'));
      expect(playgroundPkg.dependencies.flarecms).toBe('latest');
      expect(playgroundPkg.dependencies['@flarecms/plugin-my-new-plugin']).toBe('workspace:*');
    } finally {
      process.chdir(originalCwd);
      if (existsSync(monorepoTestDir)) rmSync(monorepoTestDir, { recursive: true, force: true });
    }
  }, 15000);
});
