import { createRouter } from '@nanostores/router';

export const $router = createRouter({
  home: '/',
  login: '/login',
  collections: '/collections',
  users: '/users',
  settings: '/settings',
  collection: '/collection/:id/:slug', // Schema Editor
  record_list: '/:slug', // Records List
  record_edit: '/:slug/:id', // Record Editor
});
