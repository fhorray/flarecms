import React from 'react';
import { 
  RefreshCw, 
  UserCheck, 
  TrendingUp, 
  Circle,
  ArrowRight,
  Shield,
  ChevronRight,
  Target
} from 'lucide-react';
import { cn } from 'flarecms/client';

interface StripeSubscriptionsProps {
  subscriptions: any[];
  currency: string;
}

export function StripeSubscriptionsView({ subscriptions = [], currency = 'usd' }: StripeSubscriptionsProps) {
  const safeSubs = (subscriptions || []);
  const activeSubs = safeSubs.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((acc, s) => acc + (s.items?.data?.[0]?.price?.unit_amount || 0), 0);
  const safeCurrency = (currency || 'usd').toUpperCase();

  return (
    <div className="stripe-container space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Subscription Health</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Recurring <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Revenue</span>
          </h1>
          <p className="text-base text-zinc-500 max-w-md font-medium leading-relaxed">
            Monitoring Monthly Recurring Revenue (MRR) and subscriber retention.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border bg-white border-zinc-100 text-zinc-600 shadow-sm">
          <Shield size={16} className="text-[#635bff]" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Churn Rate</span>
            <span className="text-xs font-bold pt-0.5">0.0% Optimized</span>
          </div>
        </div>
      </div>

      {/* Hero Stats Section - Stable Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stripe-hero-card !bg-none !bg-zinc-900 group min-h-[14rem]">
          <div className="stripe-hero-inner !bg-transparent">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <TrendingUp size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 backdrop-blur-md border border-white/10">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="stripe-stat-label !text-zinc-400">Total MRR</p>
                <h2 className="text-4xl font-black tracking-tighter text-white">
                  {(mrr / 100).toLocaleString('en-US', { style: 'currency', currency: safeCurrency })}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="stripe-glass-card min-h-[14rem]">
          <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="stripe-stat-label">Active Subscribers</p>
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900">{activeSubs.length}</h2>
          </div>
          <p className="text-[10px] text-zinc-400 font-medium">Monitoring growth in real-time</p>
        </div>

        <div className="stripe-glass-card min-h-[14rem]">
          <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <p className="stripe-stat-label">Retention Quality</p>
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900">High</h2>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 whitespace-nowrap">
            <RefreshCw size={12} className="animate-spin" />
            Automatic recovery enabled
          </div>
        </div>
      </div>

      {/* Subscription Feed */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
           <h3 className="text-xl font-black tracking-tight text-zinc-900">Subscription Feed</h3>
           <button className="px-5 py-2.5 rounded-2xl bg-[#635bff] text-white text-xs font-black shadow-lg shadow-[#635bff]/20 hover:scale-105 transition-transform">
              Manage Plans
           </button>
        </div>

        <div className="stripe-table-container">
           <div className="overflow-x-auto">
             <table className="stripe-table min-w-[700px]">
               <thead>
                 <tr>
                    <th>Subscriber</th>
                    <th>Status</th>
                    <th>Plan Hierarchy</th>
                    <th className="text-right">Cycle End</th>
                 </tr>
               </thead>
               <tbody>
                 {safeSubs.map((sub, idx) => (
                   <tr key={sub.id} className="hover:bg-zinc-50/70 transition-all duration-300 group">
                     <td>
                        <div className="flex items-center gap-4 text-wrap">
                           <div className="size-12 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group-hover:border-[#635bff]/30 transition-colors">
                              <img 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${sub.customer?.email || idx}`} 
                                alt="Subscriber"
                                className="size-full"
                              />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-zinc-900 leading-tight">
                                {sub.customer?.email || sub.customer?.id || 'Enterprise Client'}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight line-clamp-1 max-w-[150px]">
                                {sub.id}
                              </span>
                           </div>
                        </div>
                     </td>
                     <td>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          sub.status === 'active' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-zinc-50 text-zinc-400 border-zinc-100"
                        )}>
                          <Circle size={10} className={cn(sub.status === 'active' ? "stripe-animate-pulse" : "")} />
                          {sub.status || 'inactive'}
                        </div>
                     </td>
                     <td className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className="flex flex-col">
                              <span className="text-base font-black text-zinc-900 tracking-tighter">
                                {((sub.items?.data?.[0]?.price?.unit_amount || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: sub.items?.data?.[0]?.price?.currency?.toUpperCase() || safeCurrency })}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase tracking-tighter text-wrap">
                                 {sub.items?.data?.[0]?.price?.nickname || 'Recurring Plan'}
                                 <ArrowRight size={10} />
                                 {sub.items?.data?.[0]?.plan?.interval || 'month'}
                              </div>
                           </div>
                        </div>
                     </td>
                     <td className="text-right">
                       <div className="inline-flex items-center gap-3 justify-end text-wrap">
                          <div className="flex flex-col text-right">
                             <span className="text-sm font-black text-zinc-900">
                               {sub.current_period_end ? new Date(sub.current_period_end * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                             </span>
                             <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">Renewal pending</span>
                          </div>
                          <div className="size-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer">
                             <ChevronRight size={14} />
                          </div>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
