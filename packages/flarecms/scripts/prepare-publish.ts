import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const pkgPath = resolve(process.cwd(), "package.json");
const backupPath = resolve(process.cwd(), "package.json.bak");

async function prepare() {
  console.log("🚀 Preparing package.json for publication...");

  // 1. Create backup
  copyFileSync(pkgPath, backupPath);
  console.log("📦 Backup created at package.json.bak");

  // 2. Read and modify
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

  const entrypoints = [
    ".",
    "server",
    "client",
    "auth",
    "db",
    "cli",
    "plugins"
  ];

  const newExports: Record<string, any> = {};

  for (const entry of entrypoints) {
    const key = entry === "." ? "." : `./${entry}`;
    const filename = entry === "." ? "index" : `${entry}/index`;
    
    newExports[key] = {
      types: `./dist/${filename}.d.ts`,
      default: `./dist/${filename}.js`
    };
  }

  // Handle CSS separately
  newExports["./style.css"] = {
    types: "./dist/style.css.d.ts",
    default: "./dist/style.css"
  };

  pkg.exports = newExports;

  // Set dist as the main entry point for non-export-aware tools
  pkg.main = "./dist/index.js";
  pkg.types = "./dist/index.d.ts";

  // Ensure files includes dist
  if (!pkg.files) pkg.files = ["dist"];
  else if (!pkg.files.includes("dist")) {
    pkg.files.push("dist");
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("✅ package.json updated with dist exports and types.");
}

prepare().catch((err) => {
  console.error("❌ Failed to prepare package for publication:", err);
  process.exit(1);
});
