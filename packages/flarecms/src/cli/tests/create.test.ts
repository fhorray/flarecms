import { describe, it, expect, mock, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProjectCommand } from '../commands.ts';

// 1. Mock @clack/prompts
mock.module('@clack/prompts', () => ({
  intro: () => { },
  outro: () => { },
  text: async () => 'test-project',
  select: async () => 'starter',
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

// 2. Mock giget
mock.module('giget', () => ({
  downloadTemplate: async (src: string, opts: any) => {
    // Create the destination folder and a dummy package.json to simulate download
    if (!existsSync(opts.dir)) {
      mkdirSync(opts.dir, { recursive: true });
    }
    const pkg = { name: 'template', dependencies: {} };
    const wrangler = { name: 'template', d1_databases: [{ database_name: 'template-db' }] };

    const { writeFileSync } = require('node:fs');
    const { resolve } = require('node:path');

    writeFileSync(resolve(opts.dir, 'package.json'), JSON.stringify(pkg, null, 2));
    writeFileSync(resolve(opts.dir, 'wrangler.jsonc'), JSON.stringify(wrangler, null, 2));
    return { dir: opts.dir };
  }
}));

// 3. Mock child_process exec
mock.module('node:child_process', () => ({
  exec: (cmd: string, opts: any, cb: any) => {
    cb(null, { stdout: '', stderr: '' });
  }
}));

describe('CLI: createProjectCommand', () => {
  const testDir = resolve(process.cwd(), 'test-project');

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create a project and patch manifests correctly', async () => {
    // Mock process.exit to prevent test from exiting
    const exitSpy = mock(() => { });
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = exitSpy;

    await createProjectCommand();

    // Verify directory exists
    expect(existsSync(testDir)).toBe(true);

    // Verify package.json was patched
    const pkg = JSON.parse(readFileSync(resolve(testDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-project');
    expect(pkg.dependencies.flarecms).toBe('latest');

    // Verify wrangler.jsonc was patched
    const wrangler = JSON.parse(readFileSync(resolve(testDir, 'wrangler.jsonc'), 'utf-8'));
    expect(wrangler.name).toBe('test-project');
    expect(wrangler.d1_databases[0].database_name).toBe('test-project-db');

    // Restore process.exit
    process.exit = originalExit;
  });
});
