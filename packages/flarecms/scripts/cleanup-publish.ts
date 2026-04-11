import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const pkgPath = resolve(process.cwd(), "package.json");
const backupPath = resolve(process.cwd(), "package.json.bak");

async function cleanup() {
  console.log("🧹 Cleaning up after publication...");

  if (!existsSync(backupPath)) {
    console.warn("⚠️ No backup file found. Skipping cleanup.");
    return;
  }

  // 1. Get the new version from the CURRENT package.json
  const currentPkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const newVersion = currentPkg.version;

  // 2. Restore from backup
  const backupPkg = JSON.parse(readFileSync(backupPath, "utf-8"));
  
  // 3. Update version in the restored content
  backupPkg.version = newVersion;

  // 4. Save restored package.json
  writeFileSync(pkgPath, JSON.stringify(backupPkg, null, 2));
  console.log(`✅ Restored development exports. Preserved version: ${newVersion}`);

  // 5. Remove backup
  unlinkSync(backupPath);
  console.log("🗑️ Backup file removed.");
}

cleanup().catch((err) => {
  console.error("❌ Failed to cleanup after publication:", err);
  process.exit(1);
});
