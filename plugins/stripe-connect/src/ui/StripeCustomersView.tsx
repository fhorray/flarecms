import React from 'react';
import { 
  Users, 
  Mail, 
  MapPin, 
  Calendar,
  ChevronRight,
  UserPlus,
  ExternalLink,
  Shield
} from 'lucide-react';
import { cn } from 'flarecms/client';

interface StripeCustomersProps {
  customers: any[];
}

export function StripeCustomersView({ customers = [] }: StripeCustomersProps) {
  const safeCustomers = (customers || []);

  return (
    <div className="stripe-container space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="size-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Customer Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Directory</span>
          </h1>
          <p className="text-base text-zinc-500 max-w-md font-medium leading-relaxed">
            Manage your global customer base, billing profiles, and communication preferences.
          </p>
        </div>
        
        <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white text-xs font-black shadow-xl hover:scale-105 transition-transform">
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Customer List Table */}
      <div className="stripe-table-container">
        <div className="p-8 border-b border-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/10">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                 <Users size={20} />
              </div>
              <h3 className="text-lg font-black text-zinc-900">Registered Accounts</h3>
           </div>
           <span className="px-3 py-1 rounded-full bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border border-zinc-100">
             {safeCustomers.length} Total
           </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="stripe-table min-w-[700px]">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Location</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {safeCustomers.map((customer, idx) => (
                <tr key={customer.id || idx} className="hover:bg-zinc-50/70 transition-all duration-300 group">
                  <td>
                    <div className="flex items-center gap-4 text-wrap">
                      <div className="size-12 rounded-2xl bg-zinc-100 overflow-hidden border border-zinc-200 group-hover:border-purple-200 transition-colors">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email || idx}`} 
                          alt="Avatar"
                          className="size-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 leading-tight">
                          {customer.name || customer.email || 'Mystery Client'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                           <Mail size={10} />
                           {customer.email || 'no-email@stripe.com'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium whitespace-nowrap">
                       <MapPin size={14} className="text-zinc-300" />
                       {customer.address?.country || 'Global'}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium uppercase tracking-tighter whitespace-nowrap">
                       <Calendar size={14} className="text-zinc-300" />
                       {customer.created ? new Date(customer.created * 1000).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-3 justify-end whitespace-nowrap">
                       <div className="size-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-[#635bff] hover:text-white transition-all cursor-pointer">
                          <ExternalLink size={14} />
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

        {safeCustomers.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
              <Users size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900">No customers yet</h3>
              <p className="text-sm text-zinc-400 font-medium">Your client directory will appear here once you start processing payments.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
