import { registerPluginBlock } from 'flarecms/client';
import { StripeDashboardView } from './ui/StripeDashboardView';
import { StripeSubscriptionsView } from './ui/StripeSubscriptionsView';
import { StripeProductsView } from './ui/StripeProductsView';
import { StripeCustomersView } from './ui/StripeCustomersView';
import { StripePaymentLinksView } from './ui/StripePaymentLinksView';

// CSS Import for Sandbox styles
import './ui/stripe.css';

/**
 * Client-side entrypoint for Stripe Connect Plugin.
 */
export function registerStripeBlocks() {
  registerPluginBlock('stripe-dashboard', StripeDashboardView);
  registerPluginBlock('stripe-subscriptions', StripeSubscriptionsView);
  registerPluginBlock('stripe-products', StripeProductsView);
  registerPluginBlock('stripe-customers', StripeCustomersView);
  registerPluginBlock('stripe-payment-links', StripePaymentLinksView);
}

// Auto-register
registerStripeBlocks();
