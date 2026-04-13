import React from 'react';
import { useStore } from '@nanostores/react';
import { $balance, $charges } from '../store/queries';
import { CreditCard, Zap, Activity } from 'lucide-react';
interface StripeDashboardProps {
  config: { currency: string; testMode: boolean };
}

export function StripeDashboardView({ config }: StripeDashboardProps) {
  const { data: balance, loading: loadingBalance } = useStore($balance);
  const { data: charges, loading: loadingCharges } = useStore($charges);

  const available = balance?.available?.[0]?.amount ?? 0;
  const pending = balance?.pending?.[0]?.amount ?? 0;
  const safeCurrency = (config.currency || 'usd').toUpperCase();

  return (
    <div>
      <header className="mb-10">
        <h1 className="stripe-title">Account Overview</h1>
        <p className="stripe-subtitle">
          Real-time monitoring of your Stripe account and transaction flow.
        </p>
      </header>

      {/* Stat Grid */}
      <div className="stripe-card-grid">
        <StatCard
          label="Available Balance"
          value={(available / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: safeCurrency,
          })}
          icon={CreditCard}
          variant="emerald"
          loading={loadingBalance}
        />
        <StatCard
          label="Pending Balance"
          value={(pending / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: safeCurrency,
          })}
          icon={Activity}
          variant="amber"
          loading={loadingBalance}
        />
        <StatCard
          label="Account Status"
          value={config.testMode ? 'Test Mode' : 'Live Mode'}
          icon={Zap}
          variant="rose"
          valueClassName={
            config.testMode ? 'text-amber-600' : 'text-emerald-600'
          }
        />
      </div>

      {/* Transactions Section */}
      <div className="stripe-panel">
        <div className="stripe-panel-header">
          <h3>Recent Transactions</h3>
          <button className="stripe-btn stripe-btn-outline">
            View all
          </button>
        </div>

        <div>
          {loadingCharges ? (
            <div className="p-20 text-center text-sub text-sm">
              <Activity className="animate-spin mx-auto mb-2 opacity-20" />
              Loading transactions...
            </div>
          ) : (
            <table className="stripe-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(charges || []).map((charge: any) => (
                  <tr key={charge.id}>
                    <td>
                      <div className="font-bold">
                        {charge.billing_details?.name ||
                          charge.customer ||
                          'Guest'}
                      </div>
                      <div className="text-xs text-sub font-mono opacity-60">
                        {charge.id}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`stripe-badge ${charge.status === 'succeeded' ? 'success' : 'error'}`}
                      >
                        {charge.status}
                      </span>
                    </td>
                    <td className="stripe-amount">
                      {(charge.amount / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency:
                          charge.currency?.toUpperCase() || safeCurrency,
                      })}
                    </td>
                    <td className="text-xs font-medium">
                      {new Date(charge.created * 1000).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!charges || charges.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-20 text-sub italic"
                    >
                      No recent transactions found.
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

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  loading,
  valueClassName = '',
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: 'brand' | 'emerald' | 'amber' | 'rose' | 'blue';
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="stripe-stat-card">
      <div className={`icon-box ${variant}`}>
        <Icon />
      </div>
      <div>
        <div className="stripe-label">{label}</div>
        <div className={`stripe-value ${valueClassName}`}>
          {loading ? <span className="opacity-30 animate-pulse">...</span> : value}
        </div>
      </div>
    </div>
  );
}
