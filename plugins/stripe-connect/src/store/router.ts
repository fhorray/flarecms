import { createRouter } from '@nanostores/router';

export const $stripeRouter = createRouter({
  overview: '/admin/plugins/stripe-connect',
  subscriptions: '/admin/plugins/stripe-connect/subscriptions',
  products: '/admin/plugins/stripe-connect/products',
  customers: '/admin/plugins/stripe-connect/customers',
  settings: '/admin/plugins/stripe-connect/settings',
});
