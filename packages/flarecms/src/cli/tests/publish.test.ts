import { describe, it, expect, afterEach } from 'bun:test';
import { writeFileSync, readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('Publish Automation Scripts', () => {
  const testDir = resolve(process.cwd(), 'temp-test-publish');
  const pkgPath = resolve(testDir, 'package.json');
  const backupPath = resolve(testDir, 'package.json.bak');
  const scriptPrepare = resolve(process.cwd(), 'scripts/prepare-publish.ts');
  const scriptCleanup = resolve(process.cwd(), 'scripts/cleanup-publish.ts');

  const setupMockProject = () => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const pkg = {
      name: 'test-pkg',
      version: '1.0.0',
      exports: {
        '.': './src/index.ts',
        './server': './src/server/index.ts'
      },
      files: []
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  };

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it('should transform exports to dist during prepare and restore during cleanup', () => {
    setupMockProject();

    // 1. Run Prepare
    const prepareResult = spawnSync('bun', [scriptPrepare], { cwd: testDir });
    expect(prepareResult.status).toBe(0);

    // Verify transformation
    const preparedPkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(preparedPkg.exports['.']).toEqual({
      types: './dist/index.d.ts',
      default: './dist/index.js'
    });
    expect(preparedPkg.exports['./server']).toEqual({
      types: './dist/server/index.d.ts',
      default: './dist/server/index.js'
    });
    expect(preparedPkg.main).toBe('./dist/index.js');
    expect(preparedPkg.files).toContain('dist');
    expect(existsSync(backupPath)).toBe(true);

    // 2. Simulate version bump (e.g. by npm/bun publish)
    preparedPkg.version = '1.1.0';
    writeFileSync(pkgPath, JSON.stringify(preparedPkg, null, 2));

    // 3. Run Cleanup
    const cleanupResult = spawnSync('bun', [scriptCleanup], { cwd: testDir });
    expect(cleanupResult.status).toBe(0);

    // Verify restoration
    const finalPkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(finalPkg.version).toBe('1.1.0'); // Version preserved
    expect(finalPkg.exports['.']).toBe('./src/index.ts'); // Path restored
    expect(existsSync(backupPath)).toBe(false); // Backup removed
  });
});
