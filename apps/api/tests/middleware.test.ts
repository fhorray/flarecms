import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";
import { createDb } from "@flare/db";
import { ulid } from "ulidx";

describe("Middleware Logic", () => {
  let db: any;
  let env: any;

  beforeEach(() => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret" };
  });

  test("setupMiddleware: Block requests when DB is empty (Zero-Config)", async () => {
    // No tables yet
    const res = await app.request("http://localhost/api/collections", {}, env);
    expect(res.status).toBe(403);
    const body = await res.json() as { code: string };
    expect(body.code).toBe("SETUP_REQUIRED");
  });

  test("setupMiddleware: Block requests when admin user is missing", async () => {
    // 1. Initialize tables but no admin user
    const flareDb = createDb(db);
    // Mimic runMigrations by creating tables manually or just options
    await flareDb.schema.createTable('options').addColumn('name', 'text').addColumn('value', 'text').execute();
    await flareDb.schema.createTable('fc_users').addColumn('id', 'text').addColumn('email', 'text').execute();

    await flareDb.insertInto('options' as any).values({ name: 'flare:setup_complete', value: 'true' }).execute();

    const res = await app.request("http://localhost/api/collections", {}, env);
    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toContain("Admin missing");
  });

  test("authMiddleware: Reject expired sessions", async () => {
    // 1. Setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    const flareDb = createDb(db);
    const admin = await flareDb.selectFrom('fc_users' as any).selectAll().executeTakeFirst() as any;

    // 2. Create EXPIRED session
    const sessionId = ulid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 1); // Yesterday

    await flareDb.insertInto('fc_sessions' as any)
      .values({
        id: sessionId,
        user_id: admin.id,
        expires_at: expiresAt.toISOString()
      })
      .execute();

    // 3. Access
    const res = await app.request("http://localhost/api/collections", {
      headers: { "Cookie": `session=${sessionId}` }
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Session expired");
  });

  test("authMiddleware: Reject disabled users", async () => {
    // 1. Setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    const flareDb = createDb(db);
    const admin = await flareDb.selectFrom('fc_users' as any).selectAll().executeTakeFirst() as any;

    // 2. Disable user
    await flareDb.updateTable('fc_users' as any).set({ disabled: 1 }).where('id', '=', admin.id).execute();

    // 3. Login and try access
    const loginRes = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);

    // Auth should still succeed maybe? Or should login check disabled?
    // Current auth middleware checks disabled. Login also usually checks.

    const setCookie = loginRes.headers.get("Set-Cookie") || "";
    const sessionMatch = setCookie.match(/session=([^;]+)/);
    const session = sessionMatch ? sessionMatch[1] : "";

    const res = await app.request("http://localhost/api/collections", {
      headers: { "Cookie": `session=${session}` }
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Account disabled");
  });
});
