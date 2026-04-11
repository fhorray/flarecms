import { StripeRoot } from './ui/StripeRoot';
import { StripePaymentLinksView } from './ui/StripePaymentLinksView';

// CSS Import for Sandbox styles
import './ui/stripe.css';
import { registerPluginBlock } from 'flarecms';
import { StripeDashboardView } from './ui/StripeDashboardView';
import { StripeSubscriptionsView } from './ui/StripeSubscriptionsView';
import { StripeProductsView } from './ui/StripeProductsView';
import { StripeCustomersView } from './ui/StripeCustomersView';

/**
 * Client-side entrypoint for Stripe Connect Plugin.
 */
export function registerStripeBlocks() {
  registerPluginBlock('stripe-root', StripeRoot);
  registerPluginBlock('stripe-dashboard', StripeDashboardView);
  registerPluginBlock('stripe-subscriptions', StripeSubscriptionsView);
  registerPluginBlock('stripe-products', StripeProductsView);
  registerPluginBlock('stripe-customers', StripeCustomersView);
  registerPluginBlock('stripe-payment-links', StripePaymentLinksView);
}

// Auto-register
registerStripeBlocks();
