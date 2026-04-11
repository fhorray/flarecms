#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectCommand, createPluginCommand, mcpCommand } from "./commands.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8"));
const version = pkg.version;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-v") || args.includes("--version") || args[0] === "version") {
    console.log(version);
    process.exit(0);
  }

  // Simplistic command router
  if (args[0] === "mcp") {
    await mcpCommand(args.slice(1));
  } else if (args[0] === "plugin" && args[1] === "create") {
    await createPluginCommand();
  } else if (args.length === 0 || args[0] === "create") {
    await createProjectCommand();
  } else {
    console.log("Unknown command. Available commands: create, plugin create, mcp, version");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
