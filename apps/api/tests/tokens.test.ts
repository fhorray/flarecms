import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";

describe("API Token (PAT) Verification", () => {
  let db: any;
  let env: any;
  let adminSession: string;

  beforeEach(async () => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret", KV: { put: async () => { }, get: async () => { }, delete: async () => { } } };

    // 1. Setup
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);

    // 2. Login
    const loginRes = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);

    const setCookie = loginRes.headers.get("Set-Cookie") || "";
    const sessionMatch = setCookie.match(/session=([^;]+)/);
    adminSession = sessionMatch ? sessionMatch[1] as string : "";
  });

  test("Tokens: Create and Use valid PAT", async () => {
    // 1. Create Token
    const createRes = await app.request("http://localhost/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session=${adminSession}`
      },
      body: JSON.stringify({ name: "My Token", scopes: ["*"] })
    }, env);

    expect(createRes.status).toBe(200);
    const createBody = await createRes.json() as { data: { token: string } };
    const { token } = createBody.data;
    expect(token).toContain("ec_pat_");

    // 2. Use Token to access protected route
    const accessRes = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": `Bearer ${token}` }
    }, env);

    expect(accessRes.status).toBe(200);
  });

  test("Tokens: Reject PAT with invalid secret", async () => {
    // 1. Create Token
    const createRes = await app.request("http://localhost/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session=${adminSession}`
      },
      body: JSON.stringify({ name: "My Token", scopes: ["*"] })
    }, env);

    const rejectBody = await createRes.json() as { data: { token: string } };
    const { token } = rejectBody.data;
    const parts = token.split("_");
    const tamperedToken = `${parts[0]}_${parts[1]}_${parts[2]}tampered`; // Assuming format ec_pat_ID_SECRET

    // 2. Access with tampered secret
    const accessRes = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": `Bearer ${tamperedToken}` }
    }, env);

    expect(accessRes.status).toBe(401);
    const errorBody = await accessRes.json() as { error: string };
    expect(errorBody.error).toBe("Invalid API Token");
  });

  test("Tokens: Reject non-existent PAT ID", async () => {
    const fakeToken = "ec_pat_nonexistent_secret";

    const accessRes = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": `Bearer ${fakeToken}` }
    }, env);

    expect(accessRes.status).toBe(401);
  });

  test("Tokens: Revoked PAT no longer works", async () => {
    // 1. Create Token
    const createRes = await app.request("http://localhost/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session=${adminSession}`
      },
      body: JSON.stringify({ name: "To Revoke", scopes: ["*"] })
    }, env);

    const revokedBody = await createRes.json() as { data: { token: string, id: string } };
    const { token, id } = revokedBody.data;

    // 2. Verify it works
    const firstRes = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": `Bearer ${token}` }
    }, env);
    expect(firstRes.status).toBe(200);

    // 3. Revoke
    const revokeRes = await app.request(`http://localhost/api/tokens/${id}`, {
      method: "DELETE",
      headers: { "Cookie": `session=${adminSession}` }
    }, env);
    expect(revokeRes.status).toBe(200);

    // 4. Try again
    const secondRes = await app.request("http://localhost/api/collections", {
      headers: { "Authorization": `Bearer ${token}` }
    }, env);
    expect(secondRes.status).toBe(401);
  });
});
