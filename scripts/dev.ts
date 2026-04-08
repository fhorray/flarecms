import { spawn } from "child_process";
import { parseArgs } from "util";
import { readdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    db: { type: "boolean", short: "d" },
    clear: { type: "boolean", short: "c" },
    reset: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help) {
  console.log(`
\x1b[36mFlareCMS Development Tool\x1b[0m
Usage: bun dev [options]

Options:
  \x1b[33m-d, --db\x1b[0m       Generate migrations and synchronize local D1 database.
  \x1b[33m-c, --clear\x1b[0m    Wipe local Wrangler state (deletes all local data).
  \x1b[33m--reset\x1b[0m        Delete existing migrations and start from scratch.
  \x1b[33m-h, --help\x1b[0m     Show this help message.

Examples:
  bun dev --db           Run dev server with DB sync.
  bun dev -c -d          Clear database and sync schema before starting.
  bun dev --reset -d     Full migration reset and sync.
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

function getLatestSQL(dir: string): string | undefined {
  try {
    const files = readdirSync(dir).filter(f => f.endsWith(".sql"));
    if (files.length === 0) return undefined;
    return files.sort().reverse()[0];
  } catch {
    return undefined;
  }
}

async function main() {
  try {
    // 1. Clear Wrangler State (Triggered by --clear OR --reset)
    if (values.clear || values.reset) {
      console.log("\x1b[31m\x1b[1m[Clear] Wiping local Wrangler state...\x1b[0m");
      const wranglerState = join(process.cwd(), "apps/api/.wrangler/state");
      if (existsSync(wranglerState)) {
        rmSync(wranglerState, { recursive: true, force: true });
        console.log("\x1b[32m[Clear] Local state wiped.\x1b[0m");
      } else if (values.clear) {
        console.log("\x1b[33m[Clear] No local state found to wipe.\x1b[0m");
      }
    }

    // 2. Reset Migrations
    if (values.reset) {
      console.log("\x1b[31m\x1b[1m[Reset] Deleting existing migrations...\x1b[0m");
      const migrationDir = join(process.cwd(), "packages/db/drizzle");
      if (existsSync(migrationDir)) {
        rmSync(migrationDir, { recursive: true, force: true });
        console.log("\x1b[32m[Reset] Migrations deleted.\x1b[0m");
      }
    }

    // 3. Database Sync
    if (values.db || values.reset) {
      console.log("\x1b[35m\x1b[1m[DB] Synchronizing database tables...\x1b[0m");
      
      await runCommand("bunx drizzle-kit generate", "packages/db");
      
      const migrationDir = join(process.cwd(), "packages/db/drizzle");
      const latestSQL = getLatestSQL(migrationDir);
      
      if (!latestSQL) {
        throw new Error("No SQL migration files found.");
      }
      
      console.log(`\x1b[33m[DB] Applying ${latestSQL} to local D1...\x1b[0m`);
      const sqlPath = join(migrationDir, latestSQL);
      await runCommand(`bunx wrangler d1 execute flarecms-db --local --file="${sqlPath}"`, "apps/api");
      
      console.log("\x1b[32m\x1b[1m[DB] Database synchronized successfully!\x1b[0m\n");
    }

    console.log("\x1b[34m\x1b[1m[Dev] Starting FlareCMS Development Server...\x1b[0m");
    await runCommand("turbo run dev");
    
  } catch (error: any) {
    console.error(`\x1b[31m\x1b[1mError: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
