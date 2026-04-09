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
    const response = await apiFetch(`/collections/${collectionId}/fields`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to add field');
    
    // Invalidate the schema cache
    invalidate(`/api/collections/${collectionSlug}/schema`); 
    const result = await response.json();
    return result.data;
  }
);

export const $reloadSchema = () => {
  const slug = $activeSlug.get();
  if (slug) {
    // We can't easily invalidate from here without the invalidate function from mutate
    // But we can trigger a refresh by setting active slug to null and back
    $activeSlug.set(null);
    setTimeout(() => $activeSlug.set(slug), 10);
  }
};
