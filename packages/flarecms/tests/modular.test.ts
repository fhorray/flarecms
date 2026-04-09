import { expect, test, describe } from "bun:test";
import { createFlareAPI } from "../src/server";
import { Hono } from "hono";

describe("Modular API", () => {
  test("createFlareAPI returns a Hono instance", () => {
    const api = createFlareAPI();
    expect(api).toBeInstanceOf(Hono);
  });

  test("API has health check route", async () => {
    const api = createFlareAPI();
    const res = await api.request("/health");
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.data.status).toBe("ok");
  });

  test("API injects reservedSlugs middleware", async () => {
    const api = createFlareAPI({ base: '/custom-admin' });
    api.get('/test-context', (c) => {
      return c.json({ slugs: c.get('reservedSlugs') });
    });
    const res = await api.request("/test-context");
    const data: any = await res.json();
    expect(data.slugs).toContain('custom-admin');
    expect(data.slugs).toContain('api');
  });
});
