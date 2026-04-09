import { createRouter } from '@nanostores/router';

globalThis.document = { body: { addEventListener: () => {}, removeEventListener: () => {} } };
globalThis.window = { 
  location: new URL('http://localhost:8787/admin'),
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.location = globalThis.window.location;

const base = 'admin'; // No slash!

const router = createRouter({
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

console.log(router.get());
