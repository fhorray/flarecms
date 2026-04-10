import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Plugin Registry
  await db.schema
    .createTable('fc_plugins')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey()) // ULID
    .addColumn('plugin_id', 'text', (col) => col.notNull().unique()) // e.g. "seo-toolkit"
    .addColumn('version', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('inactive'))
    .addColumn('capabilities', 'text') // JSON array
    .addColumn('allowed_hosts', 'text') // JSON array
    .addColumn('storage_config', 'text') // JSON object
    .addColumn('manifest', 'text') // Full PluginManifest JSON
    .addColumn('backend_code', 'text') // JS bundle for sandboxed execution
    .addColumn('installed_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('activated_at', 'text')
    .execute();

  // Plugin Isolated Storage
  await db.schema
    .createTable('_fc_plugin_storage')
    .ifNotExists()
    .addColumn('plugin_id', 'text', (col) => col.notNull())
    .addColumn('collection', 'text', (col) => col.notNull())
    .addColumn('id', 'text', (col) => col.notNull())
    .addColumn('data', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addPrimaryKeyConstraint('pk_plugin_storage', ['plugin_id', 'collection', 'id'])
    .execute();

  // Plugin Cron Tasks
  await db.schema
    .createTable('_fc_cron_tasks')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('plugin_id', 'text', (col) => col.notNull())
    .addColumn('schedule', 'text', (col) => col.notNull())
    .addColumn('last_run_at', 'text')
    .addColumn('next_run_at', 'text')
    .addColumn('enabled', 'integer', (col) => col.defaultTo(1))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('fc_plugins').ifExists().execute();
  await db.schema.dropTable('_fc_plugin_storage').ifExists().execute();
  await db.schema.dropTable('_fc_cron_tasks').ifExists().execute();
}
