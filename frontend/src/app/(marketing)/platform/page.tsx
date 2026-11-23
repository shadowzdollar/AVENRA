import type { Metadata } from 'next';
import { PlatformExperience } from '@/features/marketing/platform-experience';

export const metadata: Metadata = {
  title: 'Platform | Avenra',
  description:
    'Interactive walkthrough of Avenra’s engagement state machine, ClamAV verification, SHA-256 audit ledger, and explicit permission model.'
};

export default function PlatformPage() {
  return <PlatformExperience />;
}
