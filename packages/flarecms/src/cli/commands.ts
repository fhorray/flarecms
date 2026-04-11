import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { downloadTemplate } from "giget";
import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { runMcpBridge } from "./mcp.ts";

import { fileURLToPath } from "node:url";

const execAsync = promisify(exec);
const PROJECT_NAME_PATTERN = /^[a-z0-9-]+$/;

// Template definitions
const TEMPLATES = {
  starter: {
    name: "Starter (Hono + React)",
    description: "Unified single-process FlareCMS starter for Cloudflare Workers",
    dir: "templates/starter",
  },
  "plugin-development": {
    name: "Plugin Development",
    description: "A pre-configured plugin template",
    dir: "templates/plugin-development",
  },
  nextjs: {
    name: "Next.js",
    description: "A pre-configured Next.js template",
    dir: "templates/nextjs-starter",
  },
  // blog: {
  //   name: "Blog (Coming Soon)",
  //   description: "A pre-configured blog template",
  //   dir: "templates/blog",
  // },

} as const;

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

  // Step 2: Template Selection
  const templateKey = await p.select({
    message: "Which template would you like to use?",
    options: Object.entries(TEMPLATES).map(([key, t]) => ({
      value: key,
      label: t.name,
      hint: t.description,
    })),
    initialValue: "starter",
  });

  if (p.isCancel(templateKey)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
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
    if (templateKey === 'nextjs') {
      s.stop("Starting Next.js setup...");

      // 1. Run create-next-app
      const nextVersion = "15.1.0"; // Stable default, can be customized
      p.log.info(`${pc.cyan("Running:")} bun create next-app@${nextVersion} ${projectName} --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-bun`);

      try {
        await execAsync(`bun create next-app@${nextVersion} ${projectName} --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-bun --yes`, {
          env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }
        });
      } catch (err) {
        // Fallback or handle error
        p.log.warn("create-next-app failed or was already present. Continuing with injection...");
      }

      s.start("Injecting FlareCMS configuration...");
    }

    const currentFilePath = fileURLToPath(import.meta.url);
    const cliDir = resolve(currentFilePath, "..");
    const localTemplatesRoot = resolve(cliDir, "..", "..", "..", "..", "templates");

    if (templateKey === 'plugin-development') {
      const pluginId = (projectName as string).toLowerCase().replace(/[^a-z0-9]/g, "-");
      const pluginPackageName = `@flarecms/plugin-${pluginId}`;
      const pluginNameHuman = (projectName as string)
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const playgroundName = `${pluginId}-playground`;

      // Placeholders to replace across ALL files (text-level substitution)
      const placeholders: Record<string, string> = {
        "{{PLUGIN_ID}}": pluginId,
        "{{PLUGIN_NAME}}": pluginPackageName,
        "{{PLUGIN_PACKAGE_NAME}}": pluginPackageName,
        "{{PLUGIN_NAME_HUMAN}}": pluginNameHuman,
        "{{PLAYGROUND_NAME}}": playgroundName,
      };

      // Universal file patcher — works on any text file
      const TEXT_EXTENSIONS = new Set([
        ".ts", ".tsx", ".js", ".jsx", ".json",
        ".html", ".css", ".md", ".txt", ".toml",
        ".jsonc", ".env", ".env.example"
      ]);

      const patchFile = (filePath: string) => {
        const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) return;

        let content = readFileSync(filePath, "utf-8");
        for (const [key, value] of Object.entries(placeholders)) {
          content = content.replaceAll(key, value);
        }

        // Extra JSON-level fixes for package.json files
        if (ext === ".json" && filePath.endsWith("package.json")) {
          try {
            const pkg = JSON.parse(content);
            // Fix flarecms workspace:* → latest
            for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
              if (pkg[field]?.["flarecms"] === "workspace:*") {
                pkg[field]["flarecms"] = "latest";
              }
            }
            content = JSON.stringify(pkg, null, 2) + "\n";
          } catch {
            // not valid JSON, write raw
          }
        }

        writeFileSync(filePath, content);
      };

      // Recursively patch every file under a directory
      const patchDir = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = resolve(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".git") {
              patchDir(full);
            }
          } else {
            patchFile(full);
          }
        }
      };

      // ── Copy / Download templates ──────────────────────────────────────────
      // Mirror the template exactly: playground/ and starter-plugin/ at root
      const localPluginSrc = resolve(localTemplatesRoot, "plugin-development", "starter-plugin");
      const localPlaygroundSrc = resolve(localTemplatesRoot, "plugin-development", "playground");

      const destPlugin = resolve(projectDir, "starter-plugin");
      const destPlayground = resolve(projectDir, "playground");

      if (existsSync(localPluginSrc) && existsSync(localPlaygroundSrc)) {
        // Development / monorepo flow
        mkdirSync(projectDir, { recursive: true });
        cpSync(localPluginSrc, destPlugin, { recursive: true });
        cpSync(localPlaygroundSrc, destPlayground, { recursive: true });
      } else {
        // Production flow: pull from GitHub via giget
        mkdirSync(projectDir, { recursive: true });
        try {
          await downloadTemplate(
            "github:fhorray/flarecms/templates/plugin-development/starter-plugin",
            { dir: destPlugin, force: true }
          );
          await downloadTemplate(
            "github:fhorray/flarecms/templates/plugin-development/playground",
            { dir: destPlayground, force: true }
          );
        } catch (err) {
          throw new Error(
            `Failed to download plugin templates: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // ── Write root workspace package.json ─────────────────────────────────
      const rootPkg = {
        name: projectName as string,
        version: "0.1.0",
        private: true,
        workspaces: ["starter-plugin", "playground"],
        scripts: {
          "dev": "bun --cwd playground dev",
          "build": "bun --cwd playground build",
        }
      };
      writeFileSync(resolve(projectDir, "package.json"), JSON.stringify(rootPkg, null, 2) + "\n");

      // ── Patch ALL files recursively ────────────────────────────────────────
      patchDir(projectDir);

    } else {
      const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
      const localTemplatePath = resolve(localTemplatesRoot, template.dir.split('/').pop() || '');

      if (existsSync(localTemplatePath)) {
        if (!existsSync(projectDir)) {
          mkdirSync(projectDir, { recursive: true });
        }
        cpSync(localTemplatePath, projectDir, { recursive: true });
      } else if (templateKey !== 'nextjs') {
        // Production flow: download from GitHub
        const remoteSource = `github:fhorray/flarecms/${template.dir}`;
        await downloadTemplate(remoteSource, {
          dir: projectDir,
          force: true,
        });
      }
    }

    // 1. Update package.json (skip if it's the root workspace package we just created)
    if (templateKey !== 'plugin-development') {
      const pkgPath = resolve(projectDir, "package.json");
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        pkg.name = projectName;
        pkg.version = "0.1.0";
        // Ensure flarecms dependency is present
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies["flarecms"] = "latest";
        pkg.dependencies["hono"] = "latest";

        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }

    // 2. Setup Wrangler logic
    const wranglerPath = resolve(projectDir, "wrangler.jsonc");
    if (existsSync(wranglerPath)) {
      let wranglerContent = readFileSync(wranglerPath, "utf-8");
      // Basic JSON string replacement for simplicity in CLI
      wranglerContent = wranglerContent.replace(/"name":\s*".*"/, `"name": "${projectName}"`);
      wranglerContent = wranglerContent.replace(/"database_name":\s*".*"/, `"database_name": "${projectName}-db"`);
      writeFileSync(wranglerPath, wranglerContent);
    }

    s.stop("Project created!");

    if (shouldInstall) {
      s.start(`Installing dependencies with ${pc.cyan("bun")}...`);
      try {
        await execAsync("bun install", { cwd: projectDir });
        s.stop("Dependencies installed!");

        if (templateKey !== 'plugin-development') {
          s.start("Generating TypeScript bindings...");
          try {
            await execAsync("bun wrangler types", { cwd: projectDir });
            s.stop("TypeScript bindings generated!");
          } catch (err) {
            s.stop("Failed to generate bindings (this is normal if wrangler.jsonc is incomplete)");
          }
        }
      } catch (err) {
        s.stop("Failed to install dependencies");
        p.log.warn(`Run ${pc.cyan(`cd ${projectName} && bun install`)} manually`);
      }
    }

    const steps = [`cd ${projectName}`, "bun run dev"];
    p.note(steps.join("\n"), "Next steps");

    p.outro(`${pc.green("Done!")} Your FlareCMS project is ready at ${pc.cyan(projectName)}`);

  } catch (error) {
    s.stop("Failed to create project");
    p.log.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function createPluginCommand() {
  console.clear();
  console.log(`\n  ${pc.bold(pc.yellow("— F L A R E C M S —"))}\n`);
  p.intro("Create a new FlareCMS Plugin");

  const rawName = await p.text({
    message: "Plugin name?",
    placeholder: "my-awesome-plugin",
    validate: (value) => {
      if (!value) return "Plugin name is required";
      return undefined;
    },
  });

  if (p.isCancel(rawName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const pluginId = (rawName as string).toLowerCase().replace(/[^a-z0-9]/g, "-");
  const pluginPackageName = `@flarecms/plugin-${pluginId}`;
  const pluginNameHuman = (rawName as string)
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const playgroundName = `${pluginId}-playground`;
  const rootDir = process.cwd();

  const currentFilePath = fileURLToPath(import.meta.url);
  const cliDir = resolve(currentFilePath, "..");
  const localTemplatesRoot = resolve(cliDir, "..", "..", "..", "..", "templates");
  const templateBase = resolve(localTemplatesRoot, "plugin-development");

  if (!existsSync(templateBase)) {
    p.log.error(`Template not found at ${templateBase}. This command works only within the FlareCMS monorepo for now.`);
    process.exit(1);
  }

  const paths = {
    targetPlugin: resolve(rootDir, "plugins", pluginId),
    targetPlayground: resolve(rootDir, "apps", playgroundName),
  };

  if (existsSync(paths.targetPlugin) || existsSync(paths.targetPlayground)) {
    p.log.error(`Folders already exist for ${pc.cyan(pluginId)}. Aborting.`);
    process.exit(1);
  }

  const s = p.spinner();
  s.start(`Creating ${pc.cyan(pluginNameHuman)}...`);

  try {
    // 1. Copy Plugin Template
    cpSync(resolve(templateBase, "starter-plugin"), paths.targetPlugin, { recursive: true });

    // 2. Copy Playground Template
    cpSync(resolve(templateBase, "playground"), paths.targetPlayground, { recursive: true });

    // 3. Replace placeholders (Universal Patching Engine)
    const placeholders = {
      "{{PLUGIN_NAME}}": pluginPackageName,
      "{{PLUGIN_ID}}": pluginId,
      "{{PLUGIN_NAME_HUMAN}}": pluginNameHuman,
      "{{PLUGIN_PACKAGE_NAME}}": pluginPackageName,
      "{{PLAYGROUND_NAME}}": playgroundName,
    };

    const TEXT_EXTENSIONS = new Set([
      ".ts", ".tsx", ".js", ".jsx", ".json",
      ".html", ".css", ".md", ".txt", ".toml",
      ".jsonc", ".env", ".env.example"
    ]);

    const patchFile = (filePath: string) => {
      const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) return;
      
      let content = readFileSync(filePath, "utf-8");
      for (const [key, value] of Object.entries(placeholders)) {
        content = content.replaceAll(key, value);
      }

      // Extra JSON-level fixes for package.json files
      if (ext === ".json" && filePath.endsWith("package.json")) {
        try {
          const pkg = JSON.parse(content);
          for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
            if (pkg[field]?.["flarecms"] === "workspace:*") {
              pkg[field]["flarecms"] = "latest";
            }
          }
          content = JSON.stringify(pkg, null, 2) + "\n";
        } catch { }
      }
      writeFileSync(filePath, content);
    };

    const patchDir = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git") patchDir(full);
        } else {
          patchFile(full);
        }
      }
    };

    patchDir(paths.targetPlugin);
    patchDir(paths.targetPlayground);

    s.stop("Plugin created!");

    p.note(
      `cd apps/${playgroundName}\nbun install\nbun dev`,
      "Next steps for development"
    );

    p.outro(`${pc.green("Success!")} Developed your plugin at ${pc.cyan(`plugins/${pluginId}`)}`);
  } catch (error) {
    s.stop("Failed to generate plugin");
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
