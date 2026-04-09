import { sql, type Migration } from 'kysely';
import type { FlareDb } from './index';

import * as initialSchema from './migrations/001_initial_schema';
import * as authTables from './migrations/002_auth_tables';

const STATIC_MIGRATIONS: Record<string, any> = {
  '001_initial_schema': initialSchema,
  '002_auth_tables': authTables,
};

/**
 * Manual D1-safe migration runner.
 * We avoid Kysely's built-in Migrator because it uses introspection (sqlite_master)
 * which Cloudflare D1 restricts, causing SQLITE_AUTH errors.
 */
export async function runMigrations(db: FlareDb) {
  // 1. Ensure migrations table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _fc_migrations (
      name TEXT PRIMARY KEY,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);

  // 2. Get executed migrations
  const executed = await db
    .selectFrom('_fc_migrations' as any)
    .select('name')
    .execute();
  const executedNames = new Set(executed.map((m: any) => m.name));

  const results: { name: string; status: 'Success' | 'Skipped' | 'Error' }[] = [];

  // 3. Run missing migrations in order
  const migrationNames = Object.keys(STATIC_MIGRATIONS).sort();

  for (const name of migrationNames) {
    if (executedNames.has(name)) {
      results.push({ name, status: 'Skipped' });
      continue;
    }

    try {
      const migration = STATIC_MIGRATIONS[name];
      await migration.up(db);

      await db
        .insertInto('_fc_migrations' as any)
        .values({ name })
        .execute();

      results.push({ name, status: 'Success' });
    } catch (err) {
      console.error(`Migration ${name} failed:`, err);
      throw err;
    }
  }

  return results;
}
