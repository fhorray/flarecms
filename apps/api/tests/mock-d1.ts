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
      // Just simulate prepare errors rather than crashing completely if it's a kysely probe query
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
