import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const collections = sqliteTable("_collections", {
  id: text("id").primaryKey(), // ULID
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  labelSingular: text("label_singular"),
  description: text("description"),
  icon: text("icon"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const fields = sqliteTable('fc_fields', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull().references(() => collections.id),
  label: text('label').notNull(),
  slug: text('slug').notNull(),
  type: text('type').notNull(),
  required: integer('required', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable('fc_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
