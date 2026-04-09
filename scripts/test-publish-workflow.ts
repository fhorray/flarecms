import { resolve } from "node:path";
import pc from "picocolors";
import { transformValue } from "./publish-utils";

async function testWorkflow() {
  console.log(pc.cyan("\n🧪 Starting Publish Workflow Dry-Run Test..."));

  const packageDir = resolve(process.cwd(), "packages/flarecms");
  const pkgPath = resolve(packageDir, "package.json");

  // 1. Capture Original
  const rawPkg = await Bun.file(pkgPath).text();
  const originalPkgJson = JSON.parse(rawPkg);
  console.log(pc.green("✅ Original package.json loaded"));

  // 2. Simulate Version Bump
  const newVersion = "9.9.9-dryrun";
  console.log(pc.blue(`🔹 Simulating bump to v${newVersion}`));

  // 3. Create Dev Mode (Should have new version)
  const devModePkgJson = { ...originalPkgJson, version: newVersion };

  // 4. Create Publish Mode
  const publishPkgJson = JSON.parse(JSON.stringify(devModePkgJson));
  
  if (publishPkgJson.exports) publishPkgJson.exports = transformValue(publishPkgJson.exports);
  if (publishPkgJson.bin) publishPkgJson.bin = transformValue(publishPkgJson.bin);
  if (publishPkgJson.main) publishPkgJson.main = transformValue(publishPkgJson.main, "main");
  if (publishPkgJson.module) publishPkgJson.module = transformValue(publishPkgJson.module, "module");
  if (publishPkgJson.types) publishPkgJson.types = transformValue(publishPkgJson.types, "types");
  
  publishPkgJson.files = ["dist"];

  console.log(pc.green("✅ Transformation complete"));

  // 5. Verifications
  const checks = [
    { name: "Version Bump", pass: publishPkgJson.version === newVersion },
    { name: "Files optimized to ['dist']", pass: publishPkgJson.files.length === 1 && publishPkgJson.files[0] === "dist" },
    { name: "Main points to dist", pass: publishPkgJson.main === "./dist/index.js" },
    { name: "Bin points to dist", pass: publishPkgJson.bin.flarecms === "./dist/cli/index.js" },
    { name: "Exports (Root) point to dist", pass: publishPkgJson.exports["."] === "./dist/index.js" },
    { name: "Exports (CLI) point to dist", pass: publishPkgJson.exports["./cli"] === "./dist/cli/index.js" },
  ];

  console.log("\n📋 Validation Results:");
  let allPass = true;
  for (const check of checks) {
    if (check.pass) {
      console.log(`${pc.green("✔")} ${check.name}`);
    } else {
      console.log(`${pc.red("✘")} ${check.name}`);
      allPass = false;
    }
  }

  if (allPass) {
    console.log(pc.bgGreen(pc.black("\n PASS: Publish logic is robust! ")));
  } else {
    console.log(pc.bgRed(pc.black("\n FAIL: Publish logic has issues. ")));
    process.exit(1);
  }
}

testWorkflow().catch(console.error);
