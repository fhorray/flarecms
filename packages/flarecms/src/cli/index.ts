#!/usr/bin/env bun
import pc from "picocolors";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectCommand, createPluginCommand, mcpCommand } from "./commands.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8"));
const version = pkg.version;

function displayHelp() {
  console.log(`\n  ${pc.bold(pc.yellow("— F L A R E C M S —"))} ${pc.dim(`v${version}`)}\n`);
  console.log(`  ${pc.bold("Usage:")} ${pc.cyan("flarecms")} ${pc.dim("<command> [options]")}\n`);
  
  console.log(`  ${pc.bold("Commands:")}`);
  console.log(`    ${pc.cyan("create")}           ${pc.dim("Initialize a new FlareCMS project (default)")}`);
  console.log(`    ${pc.cyan("plugin create")}    ${pc.dim("Create a new FlareCMS plugin")}`);
  console.log(`    ${pc.cyan("mcp")}              ${pc.dim("Start the FlareCMS MCP bridge")}`);
  console.log(`    ${pc.cyan("version")}          ${pc.dim("Show current version")}`);
  console.log(`    ${pc.cyan("help")}             ${pc.dim("Show this help message")}\n`);

  console.log(`  ${pc.bold("Options:")}`);
  console.log(`    ${pc.cyan("-v, --version")}    ${pc.dim("Show current version")}`);
  console.log(`    ${pc.cyan("-h, --help")}       ${pc.dim("Show this help message")}\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || args[0] === "help") {
    displayHelp();
    process.exit(0);
  }

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
    displayHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
