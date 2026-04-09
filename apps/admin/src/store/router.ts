import { createRouter } from '@nanostores/router';

export const $router = createRouter({
  home: '/',
  setup: '/setup',
  login: '/login',
  signup: '/signup',
  collections: '/collections',
  users: '/users',
  settings: '/settings',
  settings_general: '/settings/general',
  settings_seo: '/settings/seo',
  settings_security: '/settings/security',
  settings_signup: '/settings/signup',
  settings_api: '/settings/api',

  device: '/device',
  collection: '/collection/:id/:slug', // Schema Editor
  document_list: '/:slug', // Documents List
  document_edit: '/:slug/:id', // Document Editor
});
