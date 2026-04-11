import React from 'react';
import { useStore } from '@nanostores/react';
import { $customers } from '../store/queries';
import { Users, UserPlus, Search, Mail, Calendar, ExternalLink } from 'lucide-react';

interface StripeCustomersProps {
  config: { currency: string; testMode: boolean };
}

export function StripeCustomersView({ config }: StripeCustomersProps) {
  const { data: customers, loading } = useStore($customers);
  const safeCustomers = customers || [];

  return (
    <div>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="stripe-title">Customers</h1>
          <p className="stripe-subtitle">
            Manage your customer relationships and personal data.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="stripe-btn stripe-btn-outline">
            <Search size={16} />
            Search
          </button>
          <button className="stripe-btn stripe-btn-primary">
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      </header>

      <div className="stripe-panel">
        <div className="stripe-panel-header">
          <h3>Customer Directory</h3>
        </div>

        <div>
          {loading ? (
            <div className="p-20 text-center text-sub">
              <Users className="animate-spin mx-auto mb-2 opacity-20" />
              Loading customer database...
            </div>
          ) : (
            <table className="stripe-table">
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Contact</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeCustomers.map((customer: any) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-brand">
                          {(customer.name || customer.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {customer.name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-sub font-mono opacity-60">
                            {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail size={12} className="text-sub" />
                        {customer.email || 'No email'}
                      </div>
                    </td>
                    <td>
                      <span className="stripe-badge info">
                        {customer.delinquent ? 'Risk' : 'Direct'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-semibold text-sub">
                        <Calendar size={12} />
                        {new Date(customer.created * 1000).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="p-1.5 rounded hover:bg-slate-100 text-sub hover:text-brand transition-colors">
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {safeCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-20 text-sub italic"
                    >
                      No customers found in this account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
