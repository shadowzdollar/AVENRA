import type { Metadata } from 'next';
import { IntegrationsExperience } from '@/features/marketing/integrations-experience';

export const metadata: Metadata = {
  title: 'Integrations & Webhooks | Avenra',
  description:
    'Interactive webhook playground with HMAC-SHA256 verification snippets, exponential retry testing, and S3 completion manifests.'
};

export default function IntegrationsPage() {
  return <IntegrationsExperience />;
}
