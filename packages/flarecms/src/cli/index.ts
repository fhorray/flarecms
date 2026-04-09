#!/usr/bin/env bun
import { createProjectCommand, mcpCommand } from "./commands.ts";

async function main() {
  const args = process.argv.slice(2);

  // Simplistic command router
  if (args[0] === "mcp") {
    await mcpCommand(args.slice(1));
  } else if (args.length === 0 || args[0] === "create") {
    await createProjectCommand();
  } else {
    console.log("Unknown command. Available commands: create, mcp");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
