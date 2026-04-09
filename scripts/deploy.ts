import { spawn } from "child_process";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    db: { type: "boolean", short: "d" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
\x1b[36mFlareCMS Deployment Tool\x1b[0m
Usage: bun deploy [options]

Options:
  \x1b[33m-d, --db\x1b[0m       Apply migrations to remote D1 database before deployment.
  \x1b[33m-h, --help\x1b[0m     Show this help message.

Examples:
  bun deploy             Standard build and deploy.
  bun deploy --db        Apply migrations and deploy.
  `);
  process.exit(0);
}

async function runCommand(command: string, cwd?: string) {
  console.log(`\x1b[36m> Executing: ${command}\x1b[0m`);
  const process = spawn(command, {
    stdio: "inherit",
    shell: true,
    cwd,
  });

  return new Promise((resolve, reject) => {
    process.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function main() {
  try {
    // 1. Build workspace (Admin + API + Packages)
    console.log("\x1b[34m\x1b[1m[Deploy] Building workspace...\x1b[0m");
    await runCommand("turbo run build");

    // 2. Database Migrations (Optional)
    if (values.db) {
      console.log("\x1b[35m\x1b[1m[DB] Applying remote migrations...\x1b[0m");
      await runCommand("wrangler d1 migrations apply flarecms-db --remote", "apps/api");
      console.log("\x1b[32m\x1b[1m[DB] Migrations applied successfully!\x1b[0m\n");
    }

    // 3. Deploy to Cloudflare
    console.log("\x1b[34m\x1b[1m[Deploy] Deploying to Cloudflare Workers...\x1b[0m");
    await runCommand("wrangler deploy", "apps/api");

    console.log("\x1b[32m\x1b[1m[Deploy] FlareCMS successfully deployed!\x1b[0m");
    
  } catch (error: any) {
    console.error(`\x1b[31m\x1b[1mError: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
