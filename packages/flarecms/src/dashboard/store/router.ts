import { createRouter } from '@nanostores/router';

// Injected by FlareCMS factory in the HTML shell
const isBrowser = typeof window !== 'undefined';
export const config = isBrowser ? (window as any).__FLARE_CONFIG__ : { base: '/admin' };
export const base = config.base === '/' ? '' : config.base;

export const $router = createRouter({
  home: base || '/',
  setup: `${base}/setup`,
  login: `${base}/login`,
  signup: `${base}/signup`,
  collections: `${base}/collections`,
  users: `${base}/users`,
  settings: `${base}/settings`,
  settings_general: `${base}/settings/general`,
  settings_seo: `${base}/settings/seo`,
  settings_security: `${base}/settings/security`,
  settings_signup: `${base}/settings/signup`,
  settings_api: `${base}/settings/api`,

  device: `${base}/device`,
  collection: `${base}/collection/:id/:slug`, // Schema Editor
  document_list: `${base}/:slug`, // Documents List
  document_edit: `${base}/:slug/:id`, // Document Editor
});
