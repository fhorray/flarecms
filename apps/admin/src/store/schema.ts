import { atom } from 'nanostores';
import { createFetcherStore, createMutatorStore } from './fetcher';
import { apiFetch } from '../lib/api';
import type { CollectionSchema, Field } from '../types';

export const $activeSlug = atom<string | null>(null);

export const $schema = createFetcherStore<CollectionSchema>([
  '/api/collections/',
  $activeSlug,
  '/schema'
]);

export const $addField = createMutatorStore<Partial<Field> & { collectionSlug: string }, Field>(
  async ({ data, invalidate }) => {
    const { collectionId, collectionSlug, ...fieldData } = data;
    const response = await apiFetch(`/api/collections/${collectionId}/fields`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to add field');
    
    // Invalidate the schema cache
    invalidate(`/api/collections/${collectionSlug}/schema`); 
    return response.json();
  }
);
