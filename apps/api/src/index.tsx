import { flarecms } from 'flarecms';

/**
 * For development, we just export the unified flarecms factory.
 * In production, this will be the entry point for Cloudflare Workers.
 */
export default flarecms();
