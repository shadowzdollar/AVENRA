import { Metadata } from 'next';
import { ClientRequestPortal } from '@/features/client-portal/client-request-portal';

export const metadata: Metadata = {
  title: 'Your requested information',
  robots: { index: false, follow: false },
  referrer: 'no-referrer'
};

export default function Page() {
  return <ClientRequestPortal />;
}
