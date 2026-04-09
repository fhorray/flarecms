import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";

describe("Login Endpoints", () => {
  let db: any;
  let env: any;

  beforeEach(async () => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret" };
    // We don't initialize tables here in beforeEach to test the SETUP_REQUIRED flow in the first test
  });

  test("GET /api/collections requires setup (returns 403 SETUP_REQUIRED)", async () => {
    const res = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": "Bearer test-secret" }
    }, env);

    expect(res.status).toBe(403);
    const body = await res.json() as { code: string };
    expect(body.code).toBe("SETUP_REQUIRED");
  });

  test("POST /api/auth/login validates input with Zod", async () => {
    // 1. Setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    const res = await app.request("http://localhost/api/auth/login", {

      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notanemail",
      }) // Missing password
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };;
    expect(body.error).toBeDefined();
  });

  test("POST /api/auth/login succeeds after setup complete", async () => {
    // 1. Setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    // 2. Login
    const res = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { success: boolean } };
    expect(body.data.success).toBe(true);

    // Cookie session
    const setCookie = res.headers.get("Set-Cookie") || "";
    expect(setCookie).toContain("session=");
  });

  test("POST /api/auth/login fails with invalid credentials", async () => {
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    const res = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "wrongpassword" })
    }, env);

    expect(res.status).toBe(401);
  });
});
