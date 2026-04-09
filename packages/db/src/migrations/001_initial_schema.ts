import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('options')
    .ifNotExists()
    .addColumn('name', 'text', (col) => col.primaryKey())
    .addColumn('value', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('fc_users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.unique().notNull())
    .addColumn('password', 'text')
    .addColumn('role', 'text', (col) => col.notNull().defaultTo('admin'))
    .addColumn('disabled', 'integer', (col) => col.defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('fc_collections')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('slug', 'text', (col) => col.unique().notNull())
    .addColumn('label', 'text', (col) => col.notNull())
    .addColumn('label_singular', 'text')
    .addColumn('description', 'text')
    .addColumn('icon', 'text')
    .addColumn('is_public', 'integer', (col) => col.defaultTo(0))
    .addColumn('features', 'text') // JSON array
    .addColumn('url_pattern', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('fc_fields')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('collection_id', 'text', (col) => col.notNull())
    .addColumn('label', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('required', 'integer', (col) => col.defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('options').ifExists().execute();
  await db.schema.dropTable('fc_users').ifExists().execute();
  await db.schema.dropTable('fc_collections').ifExists().execute();
  await db.schema.dropTable('fc_fields').ifExists().execute();
}
