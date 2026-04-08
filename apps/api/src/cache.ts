import type { KVNamespace } from "@cloudflare/workers-types";

export interface SchemaCache {
  id: string;
  slug: string;
  label: string;
  fields: any[];
}

export const cache = {
  async getSchema(kv: KVNamespace, slug: string): Promise<SchemaCache | null> {
    const data = await kv.get(`schema:${slug}`);
    if (!data) return null;
    return JSON.parse(data);
  },

  async setSchema(kv: KVNamespace, slug: string, schema: SchemaCache) {
    await kv.put(`schema:${slug}`, JSON.stringify(schema), {
      expirationTtl: 60 * 60 * 24, // 24 hours (metadata is stable)
    });
  },

  async invalidateSchema(kv: KVNamespace, slug: string) {
    await kv.delete(`schema:${slug}`);
  }
};
