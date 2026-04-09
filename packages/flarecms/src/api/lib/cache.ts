import type { KVNamespace } from "@cloudflare/workers-types";

export interface SchemaCache {
  id: string;
  slug: string;
  label: string;
  is_public: number;
  features: string[];
  url_pattern: string | null;
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
  },

  async getCollectionList(kv: KVNamespace): Promise<any[] | null> {
    const data = await kv.get('collections:list');
    if (!data) return null;
    return JSON.parse(data);
  },

  async setCollectionList(kv: KVNamespace, collections: any[]) {
    await kv.put('collections:list', JSON.stringify(collections), {
      expirationTtl: 60 * 60 * 24, // 24 hours
    });
  },

  async invalidateCollectionList(kv: KVNamespace) {
    await kv.delete('collections:list');
  }
};
