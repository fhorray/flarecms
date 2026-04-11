import React from 'react';
import { useStore } from '@nanostores/react';
import { $products } from '../store/queries';
import {
  ArrowUpRightIcon,
  Package,
  Plus,
  ShoppingBag,
  Tag,
} from 'lucide-react';

interface StripeProductsProps {
  config: { currency: string; testMode: boolean };
}

export function StripeProductsView({ config }: StripeProductsProps) {
  const { data: products, loading } = useStore($products);
  const safeProducts = products || [];

  return (
    <div>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="stripe-title">Products & Services</h1>
          <p className="stripe-subtitle">
            Manage your product catalog and pricing structures.
          </p>
        </div>
        <button className="stripe-btn stripe-btn-primary">
          <Plus size={18} />
          Create Product
        </button>
      </header>

      {loading ? (
        <div className="p-20 text-center text-sub">
          <ShoppingBag className="animate-spin mx-auto mb-2 opacity-20" />
          Loading products...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeProducts.map((product: any) => (
            <div
              key={product.id}
              className="stripe-panel hover:border-brand transition-colors cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="icon-box blue">
                    <Package />
                  </div>
                  <span
                    className={`stripe-badge ${product.active ? 'success' : 'error'}`}
                  >
                    {product.active ? 'Active' : 'Archived'}
                  </span>
                </div>

                <h4 className="font-bold text-lg mb-1 group-hover:text-brand transition-colors">
                  {product.name}
                </h4>
                <p className="text-xs text-sub mb-6 line-clamp-2 h-8">
                  {product.description || 'No description provided.'}
                </p>
                <ArrowUpRightIcon
                  size={14}
                  className="text-secondary opacity-20 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
          {safeProducts.length === 0 && (
            <div className="col-span-full p-20 text-center border-2 border-dashed border-stripe-border rounded text-secondary italic">
              No products found in your Stripe account.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
