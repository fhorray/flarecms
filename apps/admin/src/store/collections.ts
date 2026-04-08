import { createFetcherStore, createMutatorStore } from './fetcher';
import { apiFetch } from '../lib/api';
import type { Collection } from '../types';

export const $collections = createFetcherStore<Collection[]>(['/api/collections']);

export const $createCollection = createMutatorStore<Partial<Collection>, Collection>(
  async ({ data, invalidate }) => {
    const response = await apiFetch('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to create collection');
    invalidate('/api/collections');
    return response.json();
  }
);
