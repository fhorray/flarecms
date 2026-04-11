import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $stripeRouter } from '../store/router';
import { StripeDashboardView } from './StripeDashboardView';
import { StripeSubscriptionsView } from './StripeSubscriptionsView';
import { StripeProductsView } from './StripeProductsView';
import { StripeCustomersView } from './StripeCustomersView';
import { redirectPage } from '@nanostores/router';
import { LayoutDashboard, RefreshCw, Package, Users, Settings } from 'lucide-react';

interface StripeRootProps {
  activePage: string;
  config: { currency: string; testMode: boolean };
}

export const StripeRoot: React.FC<StripeRootProps> = ({ activePage, config }) => {
  const page = useStore($stripeRouter);

  // Initialize router based on server-provided activePage
  useEffect(() => {
    if (activePage) {
      const base = '/admin/plugins/stripe-connect';
      const fullPath = activePage === '/' ? base : `${base}${activePage}`;
      if ($stripeRouter.get()?.path !== fullPath) {
        $stripeRouter.open(fullPath);
      }
    }
  }, [activePage]);

  // Fallback rendering if no exact route match
  const currentPath = $stripeRouter.get()?.path;
  const isAtRoot = currentPath === '/admin/plugins/stripe-connect' || currentPath === '/admin/plugins/stripe-connect/';

  if (!page && !isAtRoot) {
    return (
      <div id="fc-plugin-stripe-connect">
        <div className="p-10 text-center">
          <p className="text-secondary">Page not found ({currentPath}).</p>
          <button 
            onClick={() => $stripeRouter.open('/admin/plugins/stripe-connect')}
            className="stripe-btn stripe-btn-primary mt-4"
          >
            Go to Overview
          </button>
        </div>
      </div>
    );
  }

  const activeRoute = page?.route || 'overview';

  const renderContent = () => {
    switch (activeRoute) {
      case 'overview': return <StripeDashboardView config={config} />;
      case 'subscriptions': return <StripeSubscriptionsView config={config} />;
      case 'products': return <StripeProductsView config={config} />;
      case 'customers': return <StripeCustomersView config={config} />;
      default: return <StripeDashboardView config={config} />;
    }
  };

  return (
    <div id="fc-plugin-stripe-connect" className="stripe-animate-slide-up">
      <div className="stripe-container">
        <nav className="stripe-nav">
          <NavItem route="overview" label="Overview" icon={LayoutDashboard} active={activeRoute === 'overview'} />
          <NavItem route="subscriptions" label="Subscriptions" icon={RefreshCw} active={activeRoute === 'subscriptions'} />
          <NavItem route="products" label="Products" icon={Package} active={activeRoute === 'products'} />
          <NavItem route="customers" label="Customers" icon={Users} active={activeRoute === 'customers'} />
          <a href="/admin/plugins/stripe-connect/settings" className="stripe-nav-item">
            <Settings />
            Settings
          </a>
        </nav>

        <main className="stripe-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ 
  route: string; 
  label: string; 
  icon: React.ElementType; 
  active: boolean 
}> = ({ route, label, icon: Icon, active }) => {
  const handleClick = () => {
    const base = '/admin/plugins/stripe-connect';
    const path = route === 'overview' ? base : `${base}/${route}`;
    $stripeRouter.open(path);
  };

  return (
    <div 
      onClick={handleClick}
      className={`stripe-nav-item ${active ? 'active' : ''}`}
    >
      <Icon />
      {label}
    </div>
  );
};
