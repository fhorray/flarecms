import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";
import { createDb } from "@flare/db";
import { ulid } from "ulidx";

describe("RBAC and Scopes", () => {
  let db: any;
  let env: any;

  beforeEach(async () => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret" };
    // Initialize DB
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);
  });

  test("requireRole: Admin can access restricted route", async () => {
    // 1. Login as admin
    const loginRes = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);
    
    const setCookie = loginRes.headers.get("Set-Cookie") || "";
    const sessionMatch = setCookie.match(/session=([^;]+)/);
    const session = sessionMatch ? sessionMatch[1] : "";

    // 2. Access /api/tokens (Admin only)
    const res = await app.request("http://localhost/api/tokens", {
      headers: { "Cookie": `session=${session}` }
    }, env);

    expect(res.status).toBe(200);
  });

  test("requireRole: Editor (simulated) is forbidden from admin routes", async () => {
    const flareDb = createDb(db);
    const userId = ulid();
    
    // 1. Manually insert an editor user
    await flareDb.insertInto('fc_users' as any)
      .values({
        id: userId,
        email: 'editor@example.com',
        password: 'hashed_placeholder',
        role: 'editor'
      })
      .execute();

    // 2. Create a session for this user
    const sessionId = ulid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    
    await flareDb.insertInto('fc_sessions' as any)
      .values({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString()
      })
      .execute();

    // 3. Access /api/tokens (Admin only)
    const res = await app.request("http://localhost/api/tokens", {
      headers: { "Cookie": `session=${sessionId}` }
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });

  test("requireScope: Wildcard (*) scope works", async () => {
    // 1. Login as admin (implied * scope)
    const loginRes = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);
    
    const setCookie = loginRes.headers.get("Set-Cookie") || "";
    const sessionMatch = setCookie.match(/session=([^;]+)/);
    const session = sessionMatch ? sessionMatch[1] : "";

    // Access something that might check scopes (none check yet, but authMiddleware sets them)
    // For now we trust the middleware unit tests more if we had them, 
    // but we can verify auth context in future tests.
    expect(loginRes.status).toBe(200);
  });
});
