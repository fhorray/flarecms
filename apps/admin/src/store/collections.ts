import { createFetcherStore, createMutatorStore } from './fetcher';
import { api } from '../lib/api';
import type { Collection } from '../types';

export const $collections = createFetcherStore<Collection[]>(['/api/collections']);

export const $createCollection = createMutatorStore<Partial<Collection>, Collection>(
  async ({ data, invalidate }) => {
    const json = await api.post('api/collections', { json: data }).json<Collection>();
    invalidate('/api/collections');
    return json;
  }
);
