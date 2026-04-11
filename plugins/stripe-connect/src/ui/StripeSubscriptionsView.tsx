import React from 'react';
import { useStore } from '@nanostores/react';
import { $subscriptions } from '../store/queries';
import { RefreshCw, UserCheck, TrendingUp, ArrowRight } from 'lucide-react';

interface StripeSubscriptionsProps {
  config: { currency: string; testMode: boolean };
}

export function StripeSubscriptionsView({ config }: StripeSubscriptionsProps) {
  const { data: subscriptions, loading } = useStore($subscriptions);
  const safeSubs = subscriptions || [];
  const activeSubs = safeSubs.filter((s: any) => s.status === 'active');

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = activeSubs.reduce(
    (acc: number, s: any) =>
      acc + (s.items?.data?.[0]?.price?.unit_amount || 0),
    0,
  );
  const safeCurrency = (config.currency || 'usd').toUpperCase();

  return (
    <div>
      <header className="mb-10">
        <h1 className="stripe-title">Subscriptions</h1>
        <p className="stripe-subtitle">
          Manage your recurring revenue streams and subscriber lifecycle.
        </p>
      </header>

      {/* Stat Grid */}
      <div className="stripe-card-grid">
        <StatCard
          label="Total MRR"
          value={(mrr / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: safeCurrency,
          })}
          icon={TrendingUp}
          variant="brand"
          loading={loading}
        />
        <StatCard
          label="Active Subscribers"
          value={activeSubs.length.toString()}
          icon={UserCheck}
          variant="emerald"
          loading={loading}
        />
        <StatCard
          label="Active Plans"
          value={safeSubs.length.toString()}
          icon={RefreshCw}
          variant="blue"
          loading={loading}
        />
      </div>

      {/* List Section */}
      <div className="stripe-panel">
        <div className="stripe-panel-header">
          <h3>Subscription Management</h3>
        </div>

        <div>
          {loading ? (
            <div className="p-20 text-center text-sub text-sm">
              <RefreshCw className="animate-spin mx-auto mb-2 opacity-20" />
              Loading subscriptions...
            </div>
          ) : (
            <table className="stripe-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Status</th>
                  <th>Plan Details</th>
                  <th>Period End</th>
                </tr>
              </thead>
              <tbody>
                {safeSubs.map((sub: any) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="font-bold">
                        {sub.customer?.email ||
                          sub.customer?.name ||
                          'Customer'}
                      </div>
                      <div className="text-xs text-sub font-mono opacity-60">
                        {sub.id}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`stripe-badge ${sub.status === 'active' ? 'success' : 'warning'}`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold">
                        {(
                          (sub.items?.data?.[0]?.price?.unit_amount || 0) / 100
                        ).toLocaleString('en-US', {
                          style: 'currency',
                          currency:
                            sub.items?.data?.[0]?.price?.currency?.toUpperCase() ||
                            safeCurrency,
                        })}
                      </div>
                      <div className="text-xs text-sub flex items-center gap-1 font-medium">
                        {sub.items?.data?.[0]?.plan?.nickname || 'Basic Plan'}
                        <ArrowRight size={10} className="opacity-40" />
                        <span className="capitalize">{sub.items?.data?.[0]?.plan?.interval}ly</span>
                      </div>
                    </td>
                    <td className="text-xs font-semibold">
                      {sub.current_period_end
                        ? new Date(
                            sub.current_period_end * 1000,
                          ).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
                {safeSubs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-20 text-sub italic"
                    >
                      No subscriptions found.
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
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  variant: 'brand' | 'emerald' | 'blue' | 'rose' | 'amber';
  loading?: boolean;
}) {
  return (
    <div className="stripe-stat-card">
      <div className={`icon-box ${variant}`}>
        <Icon />
      </div>
      <div>
        <div className="stripe-label">{label}</div>
        <div className="stripe-value">
          {loading ? <span className="opacity-30 animate-pulse">...</span> : value}
        </div>
      </div>
    </div>
  );
}
