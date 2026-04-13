import { expect, test, describe, beforeEach } from "bun:test";
import { cache, type SchemaCache } from "../src/api/lib/cache";
import type { KVNamespace } from "@cloudflare/workers-types";

// Mock implementation of KVNamespace
class KVMock {
  storage = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

describe("Cache Utility", () => {
  let kv: KVNamespace;
  let kvMock: KVMock;

  beforeEach(() => {
    kvMock = new KVMock();
    kv = kvMock as unknown as KVNamespace;
  });

  describe("Schema Cache", () => {
    const mockSchema: SchemaCache = {
      id: "1",
      slug: "test-schema",
      label: "Test Schema",
      is_public: 1,
      features: ["test"],
      url_pattern: "/test",
      fields: []
    };

    test("getSchema returns null if not found", async () => {
      const result = await cache.getSchema(kv, "non-existent");
      expect(result).toBeNull();
    });

    test("setSchema and getSchema", async () => {
      await cache.setSchema(kv, mockSchema.slug, mockSchema);
      const result = await cache.getSchema(kv, mockSchema.slug);
      expect(result).toEqual(mockSchema);

      // Verify storage
      const stored = await kv.get(`schema:${mockSchema.slug}`);
      expect(stored).toBe(JSON.stringify(mockSchema));
    });

    test("invalidateSchema", async () => {
      await cache.setSchema(kv, mockSchema.slug, mockSchema);
      await cache.invalidateSchema(kv, mockSchema.slug);
      const result = await cache.getSchema(kv, mockSchema.slug);
      expect(result).toBeNull();
    });
  });

  describe("Collection List Cache", () => {
    const mockCollections = [
      { id: "1", name: "Collection 1" },
      { id: "2", name: "Collection 2" }
    ];

    test("getCollectionList returns null if not found", async () => {
      const result = await cache.getCollectionList(kv);
      expect(result).toBeNull();
    });

    test("setCollectionList and getCollectionList", async () => {
      await cache.setCollectionList(kv, mockCollections);
      const result = await cache.getCollectionList(kv);
      expect(result).toEqual(mockCollections);

      // Verify storage
      const stored = await kv.get('collections:list');
      expect(stored).toBe(JSON.stringify(mockCollections));
    });

    test("invalidateCollectionList", async () => {
      await cache.setCollectionList(kv, mockCollections);
      await cache.invalidateCollectionList(kv);
      const result = await cache.getCollectionList(kv);
      expect(result).toBeNull();
    });
  });
});
