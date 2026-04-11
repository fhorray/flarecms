import { describe, it, expect, mock, afterAll } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProjectCommand } from '../commands.ts';

// 1. Mock @clack/prompts
mock.module('@clack/prompts', () => ({
  intro: () => { },
  outro: () => { },
  text: async () => 'test-plugin-workspace',
  select: async () => 'plugin-development', // Target the new template
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

// 2. Mock child_process exec
mock.module('node:child_process', () => ({
  exec: (cmd: string, opts: any, cb: any) => {
    cb(null, { stdout: '', stderr: '' });
  }
}));

describe('CLI: createProjectCommand (Plugin Template)', () => {
  const testDir = resolve(process.cwd(), 'test-plugin-workspace');

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create a workspace structure for plugin-development', async () => {
    // Mock process.exit
    const exitSpy = mock(() => { });
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = exitSpy;

    await createProjectCommand();

    // Verify directory structure
    expect(existsSync(testDir)).toBe(true);
    expect(existsSync(resolve(testDir, 'plugins'))).toBe(true);
    expect(existsSync(resolve(testDir, 'apps'))).toBe(true);
    expect(existsSync(resolve(testDir, 'apps/playground'))).toBe(true);
    expect(existsSync(resolve(testDir, 'plugins/starter-plugin'))).toBe(true);

    // Verify root package.json for workspaces
    const pkg = JSON.parse(readFileSync(resolve(testDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-plugin-workspace');
    expect(pkg.workspaces).toContain('plugins/*');
    expect(pkg.workspaces).toContain('apps/*');
    expect(pkg.private).toBe(true);

    // Restore process.exit
    process.exit = originalExit;
  }, 15000);
});
