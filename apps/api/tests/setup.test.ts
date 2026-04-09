import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";

describe("Setup Endpoints", () => {
  let db: any;
  let env: any;

  beforeEach(() => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret" };
  });

  test("POST /api/setup initializes database tables and creates admin", async () => {
    const res = await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test CMS",
        email: "test@example.com",
        password: "securepassword",
      })
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { success: boolean } };
    expect(body.data.success).toBe(true);

    // Verify tables exist
    const optionsTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='options'").first();
    expect(optionsTable).toBeDefined();

    const usersTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fc_users'").first();
    expect(usersTable).toBeDefined();

    // Verify setup flag exists in DB
    const flag = await db.prepare("SELECT value FROM options WHERE name = 'flare:setup_complete'").first();
    expect(flag.value).toBe("true");

    // Verify user exists in DB
    const user = await db.prepare("SELECT email, role FROM fc_users WHERE email = 'test@example.com'").first();
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("admin");
  });

  test("POST /api/setup fails if setup already complete", async () => {
    // 1. Initial setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "test1@example.com", password: "pwd123456" })
    }, env);

    // 2. Try second setup
    const res = await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "test2@example.com", password: "pwd123456" })
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("System is already configured");
  });

  test("POST /api/setup validates input with Zod", async () => {
    const res = await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "", // invalid empty title
        email: "notanemail", // invalid email
        password: "123", // invalid password length
      })
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBeDefined();
  });
});
