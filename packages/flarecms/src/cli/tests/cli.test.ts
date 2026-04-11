import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { resolve } from "node:path";
import { rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function runCLI(args: string[], cwd: string = process.cwd()) {
  const cliPath = resolve(__dirname, "../index.ts");
  return spawnSync("bun", [cliPath, ...args], { cwd, encoding: "utf-8" });
}

describe("FlareCMS CLI Scaffolder", () => {
  const TEST_DIR = resolve(__dirname, "../../.test_output");

  beforeAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    spawnSync("mkdir", ["-p", TEST_DIR]);
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test("CLI prints unknown command message for invalid command", () => {
    const result = runCLI(["invalid-command"]);
    expect(result.status).not.toBe(0); // Should exit with error code 1
    expect(result.stdout + result.stderr).toContain("Unknown command. Available commands: create, plugin create, mcp");
  });

  test("CLI renders prompts successfully for create command", () => {
    const result = runCLI(["create"]);
    // Since we are mocking execution without a real interactive shell or pipe, it prints the prompt and waits or crashes on EOF.
    // The test environment doesn't allow interaction so clack will just render the first prompt.
    expect(result.stdout + result.stderr).toContain("Create a new FlareCMS project");
    expect(result.stdout + result.stderr).toContain("Project name?");
  });
});
