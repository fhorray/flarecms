import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { downloadTemplate } from "giget";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runMcpBridge } from "./mcp.ts";

const execAsync = promisify(exec);
const PROJECT_NAME_PATTERN = /^[a-z0-9-]+$/;

// We use the apps/dashboard from the same repo to mock a template structure
export async function createProjectCommand() {
  console.clear();
  console.log(`\n  ${pc.bold(pc.yellow("— F L A R E C M S —"))}\n`);
  p.intro("Create a new FlareCMS project");

  const projectName = await p.text({
    message: "Project name?",
    placeholder: "my-flare-site",
    defaultValue: "my-flare-site",
    validate: (value) => {
      if (!value) return "Project name is required";
      if (!PROJECT_NAME_PATTERN.test(value))
        return "Project name can only contain lowercase letters, numbers, and hyphens";
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const projectDir = resolve(process.cwd(), projectName as string);

  if (existsSync(projectDir)) {
    const overwrite = await p.confirm({
      message: `Directory ${projectName} already exists. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  const shouldInstall = await p.confirm({
    message: "Install dependencies with bun?",
    initialValue: true,
  });

  if (p.isCancel(shouldInstall)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const s = p.spinner();
  s.start("Creating project...");

  try {
    await downloadTemplate(`github:fhorray/flarecms/apps/dashboard`, {
      dir: projectDir,
      force: true,
    });

    // 1. Update package.json name
    const pkgPath = resolve(projectDir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      pkg.name = projectName;
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    // 2. Setup Wrangler logic here (Wrangler.toml etc)
    const wranglerPath = resolve(projectDir, "wrangler.toml");
    if (existsSync(wranglerPath)) {
      let wranglerContent = readFileSync(wranglerPath, "utf-8");
      wranglerContent = wranglerContent.replace(/name\s*=\s*".*"/, `name = "${projectName}"`);
      writeFileSync(wranglerPath, wranglerContent);
    }

    s.stop("Project created!");

    if (shouldInstall) {
      s.start(`Installing dependencies with ${pc.cyan("bun")}...`);
      try {
        await execAsync("bun install", { cwd: projectDir });
        s.stop("Dependencies installed!");
      } catch (err) {
        s.stop("Failed to install dependencies");
        p.log.warn(`Run ${pc.cyan(`cd ${projectName} && bun install`)} manually`);
      }
    }

    p.outro(`${pc.green("Done!")} Your FlareCMS project is ready at ${pc.cyan(projectName)}`);

  } catch (error) {
    s.stop("Failed to create project");
    p.log.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function mcpCommand(args: string[]) {
  // Simple argument parsing for CLI
  let url: string = (process.env.FLARE_API_URL as string) || "http://localhost:8787";
  let token = process.env.FLARE_API_TOKEN;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && i + 1 < args.length) {
      url = args[i + 1] as string;
      i++;
    } else if (args[i] === "--token" && i + 1 < args.length) {
      token = args[i + 1];
      i++;
    }
  }

  if (!url) {
    console.error(pc.red("Error: --url is required or must be set via FLARE_API_URL"));
    process.exit(1);
  }

  await runMcpBridge({ url, token });
}
