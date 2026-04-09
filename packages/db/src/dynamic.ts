import { sql } from "kysely";
import type { FlareDb } from "./index";

export const FIELD_TYPE_MAP: Record<string, string> = {
  text: "TEXT",
  number: "REAL",
  integer: "INTEGER",
  boolean: "INTEGER",
  json: "TEXT",
  date: "TEXT",
};

export async function createCollectionTable(db: FlareDb, slug: string) {
  const tableName = `ec_${slug}`;
  
  // Basic content table structure
  // id (ULID), slug, status, created_at, updated_at are standard
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).execute(db);

  // Add an index on slug
  await sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_slug ON ${tableName} (slug)`).execute(db);
}

export async function addFieldToTable(db: FlareDb, collectionSlug: string, fieldSlug: string, type: string) {
  const tableName = `ec_${collectionSlug}`;
  const columnType = FIELD_TYPE_MAP[type] || "TEXT";
  
  await sql.raw(`ALTER TABLE ${tableName} ADD COLUMN ${fieldSlug} ${columnType}`).execute(db);
}
