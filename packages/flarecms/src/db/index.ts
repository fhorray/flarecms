import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Database } from "./schema";
import type { D1Database } from "@cloudflare/workers-types";

export * from "./schema";
export * from "./dynamic";
export * from "./migrator";

export const createDb = (d1: D1Database) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  });
};

export type FlareDb = ReturnType<typeof createDb>;
