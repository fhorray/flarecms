import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ChevronRight,
  Zap,
  Shield,
  Circle
} from 'lucide-react';
import { cn } from 'flarecms/client';

interface StripeDashboardProps {
  balance: any;
  charges: any[];
  totalCustomers: number;
  currency: string;
  isTest: boolean;
}

export function StripeDashboardView({ balance, charges = [], totalCustomers, currency = 'usd', isTest }: StripeDashboardProps) {
  const available = balance?.available?.[0]?.amount ?? 0;
  const pending = balance?.pending?.[0]?.amount ?? 0;
  const safeCurrency = (currency || 'usd').toUpperCase();

  return (
    <div className="stripe-container space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-[#635bff] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Financial Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Stripe <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635bff] to-[#a370f7]">Overview</span>
          </h1>
          <p className="text-base text-zinc-500 max-w-md font-medium leading-relaxed">
            Real-time monitoring of your digital economy and customer transaction flow.
          </p>
        </div>
        
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300",
          isTest 
            ? "bg-amber-50/50 border-amber-100 text-amber-700 shadow-sm shadow-amber-100/50" 
            : "bg-emerald-50/50 border-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100/50"
        )}>
          <Shield size={16} />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase font-black tracking-widest">{isTest ? 'Sandbox' : 'Production'}</span>
            <span className="text-xs font-bold pt-0.5">{isTest ? 'Testing keys active' : 'Live processing'}</span>
          </div>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Balance Hero (using custom CSS) */}
        <div className="md:col-span-2 stripe-hero-card group">
          <div className="stripe-hero-inner">
            <svg className="absolute -right-20 -bottom-20 size-80 text-white/5 transform group-hover:scale-110 transition-transform duration-700" viewBox="0 0 200 200" fill="currentColor">
              <path d="M40,-56.3C50.2,-48.9,55.9,-34.5,59.3,-20.1C62.7,-5.7,63.9,8.7,59.4,21.3C54.8,33.9,44.5,44.7,32.3,51.8C20.1,58.9,6,62.3,-8.6,60.8C-23.2,59.3,-38.3,52.8,-49.4,42.1C-60.6,31.4,-67.7,16.4,-68.8,0.7C-70,-15,-65.2,-31.4,-54.2,-38.9C-43.2,-46.4,-26,-45,-11.2,-52.1C3.6,-59.2,18.9,-74.8,29.8,-74.8C40.6,-74.8,29.8,-63.7,40,-56.3Z" transform="translate(100 100)" />
            </svg>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/30">
                  <CreditCard size={24} />
                </div>
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="size-8 rounded-full border-2 border-[#7a48ff] bg-zinc-100 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                  <div className="size-8 rounded-full border-2 border-[#7a48ff] bg-[#5833cc] flex items-center justify-center text-[10px] font-bold text-white">
                    +{(totalCustomers || 0) > 4 ? (totalCustomers || 0) - 4 : 0}
                  </div>
                </div>
              </div>

              <div>
                <p className="stripe-stat-label !text-white/80">Total Available Funds</p>
                <div className="flex items-baseline gap-4 flex-wrap">
                  <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter">
                    {(available / 100).toLocaleString('en-US', { style: 'currency', currency: safeCurrency })}
                  </h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
                    <TrendingUp size={14} />
                    +12.5%
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/10 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-2">Pending</p>
                  <p className="text-xl font-bold text-white leading-none">
                    {(pending / 100).toLocaleString('en-US', { style: 'currency', currency: safeCurrency })}
                  </p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none mb-2">Payout Speed</p>
                   <p className="text-xl font-bold text-white leading-none">Instant</p>
                </div>
              </div>
              <button className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white text-[#635bff] font-black text-sm hover:scale-105 transition-transform shadow-xl">
                 Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* Quick View Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="stripe-glass-card min-h-[11rem]">
              <div className="flex items-center justify-between">
                <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-wrap">
                   <Zap size={20} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Growth</span>
              </div>
              <div>
                <p className="stripe-stat-label">Total Volume</p>
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">124k</h3>
              </div>
              <div className="w-full h-1 bg-zinc-50 rounded-full overflow-hidden">
                <div className="w-4/5 h-full bg-emerald-500 rounded-full" />
              </div>
           </div>

           <div className="stripe-glass-card !bg-zinc-900 !text-white shadow-xl min-h-[11rem] group cursor-pointer hover:!bg-black">
              <div className="flex items-center justify-between">
                <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                   <Users size={20} />
                </div>
                <ChevronRight size={20} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <p className="stripe-stat-label !text-zinc-500">New Customers</p>
                <h3 className="text-3xl font-black tracking-tight">+{totalCustomers || 0}</h3>
              </div>
              <p className="text-xs font-medium text-zinc-400">View recent signups and history</p>
           </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
           <h3 className="text-xl font-black tracking-tight text-zinc-900">Recent Transactions</h3>
           <div className="flex gap-2">
             <button className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-black hover:bg-zinc-200 transition-colors">Filters</button>
             <button className="px-4 py-2 rounded-xl bg-[#635bff] text-white text-xs font-black shadow-lg shadow-[#635bff]/20">Export</button>
           </div>
        </div>

        <div className="stripe-table-container">
           <div className="overflow-x-auto">
             <table className="stripe-table min-w-[600px]">
               <thead>
                 <tr>
                    <th>Merchant / Customer</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th className="text-right">Reference</th>
                 </tr>
               </thead>
               <tbody>
                 {(charges || []).map((charge, idx) => (
                   <tr key={charge.id} className="hover:bg-zinc-50/70 transition-all duration-300 group">
                     <td>
                        <div className="flex items-center gap-4 text-wrap">
                           <div className="size-12 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group-hover:border-[#635bff]/30 transition-colors">
                              <img 
                                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${charge.customer || idx}`} 
                                alt="Avatar"
                                className="size-full opacity-80"
                              />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-zinc-900 leading-tight">
                                {charge.billing_details?.name || charge.customer || 'Digital Order'}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                                {new Date(charge.created * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                        </div>
                     </td>
                     <td>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          charge.status === 'succeeded' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          <Circle size={10} className={cn(charge.status === 'succeeded' ? "stripe-animate-pulse" : "")} />
                          {charge.status || 'pending'}
                        </div>
                     </td>
                     <td className="whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className="text-base font-black text-zinc-900 tracking-tighter">
                             {(charge.amount / 100).toLocaleString('en-US', { style: 'currency', currency: charge.currency?.toUpperCase() || safeCurrency })}
                           </span>
                           <span className="text-[10px] text-zinc-400 font-medium italic">Net after fees</span>
                        </div>
                     </td>
                     <td className="text-right">
                       <div className="inline-flex items-center gap-2 group/btn">
                          <code className="text-[10px] font-mono text-zinc-300 group-hover:text-zinc-500 transition-colors">{charge.id.slice(0, 12)}...</code>
                          <div className="size-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-[#635bff] group-hover:text-white transition-all cursor-pointer">
                             <ChevronRight size={14} />
                          </div>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="p-8 bg-zinc-50/50 flex items-center justify-center border-t border-zinc-100">
              <button className="text-sm font-black text-zinc-500 hover:text-[#635bff] transition-colors flex items-center gap-2">
                 Load older transactions <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
