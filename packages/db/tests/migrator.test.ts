import { describe, expect, test, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";

export class MockD1Database {
  db: Database;

  constructor() {
    this.db = new Database(":memory:");
  }

  prepare(query: string) {
    const sqliteQuery = query.replace(/RETURNING .*/g, '');
    let stmt: any;
    try {
      stmt = this.db.prepare(sqliteQuery);
    } catch(err: any) {
      stmt = {
        all: () => { throw new Error(err.message) },
        run: () => { throw new Error(err.message) },
        get: () => { throw new Error(err.message) },
      }
    }
    
    return {
      bind: (...params: any[]) => {
        return {
          all: async () => {
            try {
              const results = stmt.all(...params);
              return { success: true, results, error: undefined, meta: { changes: 0 } };
            } catch (err: any) {
              throw new Error(err.message);
            }
          },
          run: async () => {
            try {
              const result = stmt.run(...params);
              return { success: true, results: [], meta: { changes: result.changes } };
            } catch (err: any) {
              throw new Error(err.message);
            }
          },
          first: async () => {
            try {
              const result = stmt.get(...params);
              return result;
            } catch (err: any) {
              throw new Error(err.message);
            }
          }
        };
      },
      all: async () => {
        try {
          const results = stmt.all();
          return { success: true, results, error: undefined, meta: { changes: 0 } };
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
      run: async () => {
        try {
          const result = stmt.run();
          return { success: true, results: [], meta: { changes: result.changes } };
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
      first: async () => {
        try {
          const result = stmt.get();
          return result || null;
        } catch (err: any) {
          throw new Error(err.message);
        }
      }
    };
  }

  async exec(query: string) {
    this.db.run(query);
    return { count: 1, duration: 0 };
  }

  async batch(statements: any[]) {
    this.db.transaction(() => {
      for (const stmt of statements) {
        stmt.run();
      }
    })();
    return [];
  }
}

export function createMockD1() {
  return new MockD1Database() as any;
}
import { createDb, runMigrations } from "../src/index";
import { sql } from "kysely";

describe("Static Migrations", () => {
  let db: any;

  beforeEach(() => {
    const mockD1 = createMockD1();
    db = createDb(mockD1);
  });

  test("runs all migrations perfectly", async () => {
    const results = await runMigrations(db);
    
    expect(results).toBeDefined();
    expect(results.length).toBe(3);
    expect(results[0].migrationName).toBe("001_initial_schema");
    expect(results[0].status).toBe("Success");
    
    expect(results[1].migrationName).toBe("002_auth_tables");
    expect(results[1].status).toBe("Success");

    expect(results[2].migrationName).toBe("003_advanced_auth");
    expect(results[2].status).toBe("Success");

    // It should have created the internal tracking table
    const tableCheck = await sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='_kysely_migrations'`).execute(db) as any;
    expect(tableCheck.rows.length).toBe(1);
    expect(tableCheck.rows[0].name).toBe("_kysely_migrations");
  });

  test("running migrations twice is safe and does not duplicate", async () => {
    // Run once
    await runMigrations(db);
    
    // Run twice
    const secondResults = await runMigrations(db);
    
    // Should be empty array as everything is migrated
    expect(secondResults.length).toBe(0);
  });
});
