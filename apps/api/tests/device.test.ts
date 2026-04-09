import { describe, expect, test, beforeEach } from "bun:test";
import { createMockD1 } from "./mock-d1";
import app from "../src/index";

describe("Device Authorization Flow (RFC 8628)", () => {
  let db: any;
  let env: any;

  beforeEach(async () => {
    db = createMockD1();
    env = { DB: db, AUTH_SECRET: "test-secret" };

    // Universal setup (must run before any device flow as device flow requires tables)
    await app.request("http://localhost/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CMS", email: "admin@example.com", password: "password123" })
    }, env);
  });

  test("POST /api/device/code generates user and device codes", async () => {
    const res = await app.request("http://localhost/api/device/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test-client" })
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as {
      device_code: string;
      user_code: string;
      verification_uri: string;
    };

    expect(body.device_code).toBeDefined();
    expect(body.user_code).toBeDefined();
    expect(body.user_code.length).toBeGreaterThan(4);
    expect(body.verification_uri).toBe("http://localhost/device");
  });

  test("POST /api/device/token returns authorization_pending if user hasn't approved", async () => {
    // 1. Get Code
    const codeRes = await app.request("http://localhost/api/device/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test-client" })
    }, env);
    const { device_code } = await codeRes.json() as {
      device_code: string;
    };

    // 2. Poll Token
    const tokenRes = await app.request("http://localhost/api/device/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test-client", device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" })
    }, env);

    expect(tokenRes.status).toBe(400);
    const body = await tokenRes.json() as {
      error: string;
    };
    expect(body.error).toBe("authorization_pending");
  });

  test("POST /api/device/verify (user approval) followed by /device/token generates PAT", async () => {
    // 1. Get Code
    const codeRes = await app.request("http://localhost/api/device/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test-client" })
    }, env);
    const { device_code, user_code } = await codeRes.json() as {
      device_code: string;
      user_code: string;
    };

    // 2. Mock complete user login
    const loginRes = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    }, env);

    const setCookie = loginRes.headers.get("Set-Cookie") || "";
    const sessionMatch = setCookie.match(/session=([^;]+)/);
    const loginCookie = sessionMatch ? `session=${sessionMatch[1]}` : "";

    const verifyRes = await app.request("http://localhost/api/device/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": loginCookie
      },
      body: JSON.stringify({ user_code })
    }, env);

    expect(verifyRes.status).toBe(200);

    // 3. Poll Token Again (Should Succeed with PAT)
    const tokenRes = await app.request("http://localhost/api/device/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "test-client", device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" })
    }, env);

    expect(tokenRes.status).toBe(200);
    const tokenData = await tokenRes.json() as {
      access_token: string;
      token_type: string;
      scope: string;
    };

    expect(tokenData.access_token).toBeDefined();
    expect(tokenData.access_token).toStartWith("ec_pat_");
    expect(tokenData.token_type).toBe("bearer");
    expect(tokenData.scope).toBe("content:read");
  });
});
