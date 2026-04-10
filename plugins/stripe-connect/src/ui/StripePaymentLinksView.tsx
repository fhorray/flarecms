import React from 'react';
import { 
  Link as LinkIcon, 
  Plus, 
  ExternalLink, 
  AlertCircle,
  Copy,
  ChevronLeft,
  Circle
} from 'lucide-react';
import { cn } from 'flarecms/client';
import type { StripePaymentLink, StripePrice } from '../types';

interface StripePaymentLinksProps {
  productId: string;
  productName: string;
  links: StripePaymentLink[];
  prices: StripePrice[];
}

export function StripePaymentLinksView({ productId, productName, links = [], prices = [] }: StripePaymentLinksProps) {
  const [copying, setCopying] = React.useState<string | null>(null);
  const safeLinks = (links || []);
  const safePrices = (prices || []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopying(id);
    setTimeout(() => setCopying(null), 2000);
  };

  return (
    <div className="stripe-container space-y-10 animate-in fade-in slide-in-from-left-6 duration-700">
      {/* Header with Back Button */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => (window as any).FlarePlugin?.interact({ type: 'page_load', page: '/products' })}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Back to products
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Payment Gateway</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl break-words">
              Links for <span className="text-[#635bff]">{productName}</span>
            </h1>
            <p className="text-base text-zinc-500 max-w-md font-medium leading-relaxed">
              Generate checkout URLs to share directly with your customers.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Existing Links */}
        <div className="space-y-6">
          <div className="stripe-table-container">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/10">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <LinkIcon size={20} className="text-[#635bff]" />
                Active Payment Links
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="stripe-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>URL / Link ID</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {safeLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-zinc-50/50 transition-all group">
                      <td>
                        <div className="flex flex-col max-w-[250px] md:max-w-md lg:max-w-lg text-wrap">
                          <span className="text-sm font-black text-zinc-900 truncate group-hover:text-[#635bff] transition-colors">{link.url}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{link.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          link.active 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-zinc-50 text-zinc-400 border-zinc-100"
                        )}>
                          <Circle size={10} className={cn(link.active ? "stripe-animate-pulse" : "")} />
                          {link.active ? 'Active' : 'Disabled'}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <button 
                            onClick={() => handleCopy(link.url, link.id)}
                            className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-[#635bff] hover:text-white transition-all shadow-sm"
                          >
                            {copying === link.id ? <span className="text-[8px] font-black">COPIED</span> : <Copy size={16} />}
                          </button>
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white hover:bg-black transition-all shadow-xl shadow-zinc-900/10"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {safeLinks.length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="size-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                    <AlertCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">No links found</h3>
                    <p className="text-sm text-zinc-400 font-medium">Generate your first payment link below to start selling.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Link Section */}
        <div className="space-y-6">
           <h3 className="text-2xl font-black tracking-tight text-zinc-900 px-2">Create New Link</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safePrices.map((price) => (
                <div key={price.id} className="stripe-glass-card group min-h-[16rem]">
                   <div className="relative z-10 space-y-6">
                      <div className="text-wrap">
                        <p className="text-[10px] font-black text-[#635bff] uppercase tracking-[0.2em] mb-2">{price.recurring ? 'Subscription' : 'One-time'}</p>
                        <h4 className="text-2xl font-black text-zinc-900 tracking-tighter break-words">
                          {((price.unit_amount || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: (price.currency || 'usd').toUpperCase() })}
                        </h4>
                        <p className="text-xs text-zinc-400 font-bold uppercase truncate">{price.nickname || 'Standard Pricing'}</p>
                      </div>
                   </div>
                   
                   <button 
                    onClick={() => (window as any).FlarePlugin?.interact({
                      type: 'form_submit',
                      formId: 'create_payment_link',
                      values: { priceId: price.id, productId }
                    })}
                    className="relative z-10 w-full py-4 rounded-2xl bg-[#635bff] text-white font-black text-sm shadow-xl shadow-[#635bff]/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                   >
                    <Plus size={18} />
                    Generate Link
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
