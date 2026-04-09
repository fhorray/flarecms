export * from './auth';
export * from './db';
export * from './server';
export * from './client';
export * from './types';

import { createFlareAPI } from './server';

/**
 * @deprecated Use createFlareAPI from 'flarecms/server' for better modularity.
 */
export const flarecms = createFlareAPI;
