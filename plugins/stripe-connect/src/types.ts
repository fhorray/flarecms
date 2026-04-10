/**
 * Stripe Entities and API Response Types
 */

export interface StripeConfig {
  encryptedKey: string;
  currency: string;
  testMode: boolean;
}

export interface StripeBalance {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  customer: string | null;
  billing_details: {
    name: string | null;
    email: string | null;
  };
  created: number;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  type: string;
  metadata: Record<string, string>;
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  nickname: string | null;
  product: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
  };
}

export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  address?: {
    country: string | null;
  };
}

export interface StripeSubscription {
  id: string;
  status: string;
  currency: string;
  current_period_end: number;
  customer: StripeCustomer | string;
  items: {
    data: Array<{
      price: StripePrice;
      plan: { interval: string };
    }>;
  };
}

export interface StripePaymentLink {
  id: string;
  url: string;
  active: boolean;
  line_items?: {
    data: Array<{
      price: string;
      quantity: number;
    }>;
  };
}

export interface StripeListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  total_count?: number;
}
