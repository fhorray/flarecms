import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";

describe("WebAuthn / Passkeys Setup & Login", () => {
  let db: any;
  let env: any;

  beforeEach(async () => {
    db = createMockD1();
    const kvStore = new Map<string, any>();
    env = {
      DB: db,
      AUTH_SECRET: "test-secret",
      KV: {
        get: async (k: string) => kvStore.get(k),
        put: async (k: string, v: any) => kvStore.set(k, v),
        delete: async (k: string) => kvStore.delete(k)
      }
    };

    // We DO NOT run full setup here because we want to test the setup-phase passkey options
    // But we need the tables to exist!
    // We can use the setup route but without creating a user. 
    // Wait, the new setup route runs migrations AND creates a user.
    // If we want passkey setup, we need a way to run migrations without a user.
    // Or we just call the setup route once with a failed payload? No.
  });

  test("POST /api/setup/passkey/options generates registration options", async () => {
    // 1. Run setup to get tables (this will also create an admin user though...)
    // Wait, if setup is complete, passkey options fail.
    // We need a way to just run migrations.
    // Maybe we can add a 'GET /api/setup/init' or just use the DB directly in test.

    // For now, let's manually run migrations in the test setup
    const { runMigrations } = await import("flarecms/db");
    const { createDb } = await import("flarecms/db");
    await runMigrations(createDb(db));

    const res = await app.request("http://localhost/api/setup/passkey/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com" })
    }, env);

    expect(res.status).toBe(200);
    const resBody = await res.json() as {
      data: {
        rp: any;
        user: {
          name: string;
        };
        challenge: string;
      }
    };
    const body = resBody.data;

    // SimpleWebAuthn outputs
    expect(body.rp).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.name).toBe("admin@example.com");
    expect(body.challenge).toBeDefined();
  });
});
