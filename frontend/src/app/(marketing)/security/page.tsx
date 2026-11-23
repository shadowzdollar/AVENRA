import type { Metadata } from 'next';
import { SecurityExperience } from '@/features/marketing/security-experience';

export const metadata: Metadata = {
  title: 'Security Sandbox | Avenra',
  description:
    'Interactive PostgreSQL Row-Level Security (RLS) tenant isolation simulator and 4-gate ClamAV document security inspector.'
};

export default function SecurityPage() {
  return <SecurityExperience />;
}
