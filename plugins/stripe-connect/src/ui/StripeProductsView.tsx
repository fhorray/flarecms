import React from 'react';
import { 
  Package, 
  ArrowUpRight,
  Circle,
  Plus
} from 'lucide-react';
import { cn } from 'flarecms/client';

interface StripeProductsProps {
  products: any[];
  currency: string;
}

export function StripeProductsView({ products = [], currency = 'usd' }: StripeProductsProps) {
  const safeProducts = (products || []);
  const safeCurrency = (currency || 'usd').toUpperCase();

  return (
    <div className="stripe-container space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Inventory Management</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Catalog</span>
          </h1>
          <p className="text-base text-zinc-500 max-w-md font-medium leading-relaxed">
            Manage your digital products, SKU variants, and pricing tiers.
          </p>
        </div>
        
        <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-black shadow-xl hover:scale-105 transition-transform">
          <Plus size={16} />
          Create Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeProducts.map((product) => (
          <div key={product.id} className="stripe-glass-card group min-h-[18rem]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                    <Package size={24} />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  product.active 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-zinc-50 text-zinc-400 border-zinc-100"
                )}>
                  {product.active ? 'Active' : 'Archived'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-zinc-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-400 font-medium line-clamp-3">
                  {product.description || 'No description provided for this product tier.'}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between gap-4">
              <button 
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:bg-[#635bff] hover:text-white transition-all"
                onClick={() => {
                  (window as any).FlarePlugin?.interact({
                    type: 'block_action',
                    blockId: 'view_product_links',
                    value: { productId: product.id, productName: product.name }
                  });
                }}
              >
                Manage Links
              </button>
              <div className="size-10 shrink-0 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
