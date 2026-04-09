import { useStore } from '@nanostores/react';
import { $router } from '../store/router';
import { SettingsLayout } from '../layouts/settings-layout';
import { GeneralSection } from '../components/settings/general-section';
import { SEOSection } from '../components/settings/seo-section';
import { SecuritySection } from '../components/settings/security-section';
import { SignupSection } from '../components/settings/signup-section';
import { APITokenSection } from '../components/settings/api-token-section';

export function SettingsPage() {
  const page = useStore($router);

  if (!page) return null;

  // Map routes to sections
  switch (page.route) {
    case 'settings_general':
      return (
        <SettingsLayout
          title="General Configuration"
          subtitle="Manage your platform's core identity and reading preferences."
        >
          <GeneralSection />
        </SettingsLayout>
      );
    case 'settings_seo':
      return (
        <SettingsLayout
          title="Search Engine Optimization"
          subtitle="Optimize how your platform communicates with global indexers."
        >
          <SEOSection />
        </SettingsLayout>
      );
    case 'settings_security':
      return (
        <SettingsLayout
          title="Security & Access"
          subtitle="Protect your administrative environment with modern credentials."
        >
          <SecuritySection />
        </SettingsLayout>
      );
    case 'settings_signup':
      return (
        <SettingsLayout
          title="Registration Policy"
          subtitle="Control automated user onboarding and domain domain policies."
        >
          <SignupSection />
        </SettingsLayout>
      );
    case 'settings':
    case 'settings_api':
    default:
      return (
        <SettingsLayout
          title="Administrative API"
          subtitle="Manage Personal Access Tokens for secure programmatic integration."
        >
          <APITokenSection />
        </SettingsLayout>
      );
  }
}
