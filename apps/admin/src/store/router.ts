import { createRouter } from '@nanostores/router';

export const $router = createRouter({
  home: '/',
  login: '/login',
  collections: '/collections',
  users: '/users',
  settings: '/settings',
  collection: '/collection/:id/:slug', // Schema Editor
  document_list: '/:slug', // Documents List
  document_edit: '/:slug/:id', // Document Editor
});
