import type { ColumnType, Generated, Selectable, Insertable, Updateable } from 'kysely';

export interface Database {
  options: OptionsTable;
  fc_collections: CollectionsTable;
  fc_fields: FieldsTable;
  fc_users: UsersTable;
  fc_passkeys: PasskeysTable;
  fc_sessions: SessionsTable;
  fc_api_tokens: ApiTokensTable;
  fc_oauth_accounts: OAuthAccountsTable;
  fc_verification_tokens: VerificationTokensTable;
  fc_device_codes: DeviceCodesTable;
  // This helps typescript understand that we can have arbitrary string tables for dynamic content
  [tableName: string]: any; 
}

export interface OptionsTable {
  name: string;
  value: string;
}

export type Option = Selectable<OptionsTable>;
export type NewOption = Insertable<OptionsTable>;

export interface CollectionsTable {
  id: string;
  slug: string;
  label: string;
  label_singular: string | null;
  description: string | null;
  icon: string | null;
  is_public: ColumnType<number, number | undefined, number>;
  features: string | null; // JSON array of strings
  url_pattern: string | null;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
}

export type Collection = Selectable<CollectionsTable>;
export type NewCollection = Insertable<CollectionsTable>;
export type CollectionUpdate = Updateable<CollectionsTable>;

export interface FieldsTable {
  id: string;
  collection_id: string;
  label: string;
  slug: string;
  type: string;
  required: ColumnType<number, number | undefined, number>; // sqlite boolean
  created_at: ColumnType<string, string | undefined, never>;
}

export type Field = Selectable<FieldsTable>;
export type NewField = Insertable<FieldsTable>;

export interface UsersTable {
  id: string;
  email: string;
  password: string | null; // Nullable if passkey only
  role: string;
  disabled: ColumnType<number, number | undefined, number>;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface PasskeysTable {
  id: string; // credentialID base64url encoded
  user_id: string;
  name: string | null; // User-defined alias
  public_key: string; // base64url encoded
  counter: number;
  device_type: string;
  backed_up: number;
  transports: string | null;
  created_at: ColumnType<string, string | undefined, never>;
  last_used_at: string | null;
}

export type Passkey = Selectable<PasskeysTable>;
export type NewPasskey = Insertable<PasskeysTable>;
export type PasskeyUpdate = Updateable<PasskeysTable>;

export interface SessionsTable {
  id: string;
  user_id: string;
  expires_at: string;
}

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;
export type SessionUpdate = Updateable<SessionsTable>;

export interface ApiTokensTable {
  id: string; // Token prefix (ec_pat_...)
  user_id: string;
  name: string;
  hash: string; // SHA-256 hashed secret
  scopes: string; // JSON string (array or structured object)
  expires_at: string | null;
  last_used_at: string | null;
  created_at: ColumnType<string, string | undefined, never>;
}

export type ApiToken = Selectable<ApiTokensTable>;
export type NewApiToken = Insertable<ApiTokensTable>;

export interface OAuthAccountsTable {
  provider_id: string;
  provider_user_id: string;
  user_id: string;
}

export type OAuthAccount = Selectable<OAuthAccountsTable>;
export type NewOAuthAccount = Insertable<OAuthAccountsTable>;

export interface VerificationTokensTable {
  identifier: string; // Email
  token: string;      // Hashed token
  expires_at: string;
}

export type VerificationToken = Selectable<VerificationTokensTable>;
export type NewVerificationToken = Insertable<VerificationTokensTable>;

export interface DeviceCodesTable {
  device_code: string;
  user_code: string;
  client_id: string;
  user_id: string | null; // Null until user approves
  scopes: string; // JSON string array
  expires_at: string;
  created_at: ColumnType<string, string | undefined, never>;
}

export type DeviceCode = Selectable<DeviceCodesTable>;
export type NewDeviceCode = Insertable<DeviceCodesTable>;
export type DeviceCodeUpdate = Updateable<DeviceCodesTable>;
