import { build } from "bun";
import { rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

async function runBuild() {
  const scriptDir = import.meta.dir;
  const packageDir = resolve(scriptDir, "../packages/flarecms");
  const distDir = join(packageDir, "dist");
  const pkgPath = join(packageDir, "package.json");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  console.log(`🚀 Starting Bun build for unified ${pkg.name}...`);

  console.log(`🧹 Cleaning ${distDir}...`);
  rmSync(distDir, { recursive: true, force: true });

  // Main entrypoints for subpath exports
  const entrypoints = [
    "./src/index.ts",
    "./src/auth/index.ts",
    "./src/db/index.ts",
    "./src/cli/index.ts",
    "./src/cli/commands.ts",
    "./src/cli/mcp.ts",
  ];

  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const result = await build({
    entrypoints: entrypoints.map(e => join(packageDir, e)),
    outdir: distDir,
    target: "bun",
    format: "esm",
    sourcemap: "none",
    minify: false,
    naming: "[dir]/[name].[ext]",
    root: join(packageDir, "src"),
    external,
    define: {
      "__VERSION__": JSON.stringify(pkg.version),
    },
  });

  if (!result.success) {
    console.error("❌ Bun build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log(`✅ Build complete! Artifacts generated in ${distDir}`);
}

runBuild().catch((err) => {
  console.error("❌ Unexpected build error:", err);
  process.exit(1);
});
