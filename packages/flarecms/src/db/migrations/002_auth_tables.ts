import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Core Sessions
  await db.schema
    .createTable('fc_sessions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .execute();

  // Biometric Passkeys
  await db.schema
    .createTable('fc_passkeys')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text')
    .addColumn('public_key', 'text', (col) => col.notNull())
    .addColumn('counter', 'integer', (col) => col.notNull())
    .addColumn('device_type', 'text', (col) => col.notNull())
    .addColumn('backed_up', 'integer', (col) => col.notNull())
    .addColumn('transports', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('last_used_at', 'text')
    .execute();

  // API Token Management
  await db.schema
    .createTable('fc_api_tokens')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('hash', 'text', (col) => col.notNull())
    .addColumn('scopes', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text')
    .addColumn('last_used_at', 'text')
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // OAuth Providers Linkage
  await db.schema
    .createTable('fc_oauth_accounts')
    .ifNotExists()
    .addColumn('provider_id', 'text', (col) => col.notNull())
    .addColumn('provider_user_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_oauth_accounts', ['provider_id', 'provider_user_id'])
    .execute();

  // Email/OTP Verification Tokens
  await db.schema
    .createTable('fc_verification_tokens')
    .ifNotExists()
    .addColumn('identifier', 'text', (col) => col.notNull())
    .addColumn('token', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_verification_tokens', ['identifier', 'token'])
    .execute();

  // Device Code Authorization (IoT/TV flows)
  await db.schema
    .createTable('fc_device_codes')
    .ifNotExists()
    .addColumn('device_code', 'text', (col) => col.primaryKey())
    .addColumn('user_code', 'text', (col) => col.notNull().unique())
    .addColumn('client_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text')
    .addColumn('scopes', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('fc_sessions').ifExists().execute();
  await db.schema.dropTable('fc_passkeys').ifExists().execute();
  await db.schema.dropTable('fc_api_tokens').ifExists().execute();
  await db.schema.dropTable('fc_oauth_accounts').ifExists().execute();
  await db.schema.dropTable('fc_verification_tokens').ifExists().execute();
  await db.schema.dropTable('fc_device_codes').ifExists().execute();
}
