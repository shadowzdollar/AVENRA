import type { Metadata } from 'next';
import { PricingExperience } from '@/features/marketing/pricing-experience';

export const metadata: Metadata = {
  title: 'Pricing & ROI Calculator | Avenra',
  description:
    'Interactive practice ROI calculator, transparent Starter/Business/Enterprise plans, and zero per-client seat fees.'
};

export default function PricingPage() {
  return <PricingExperience />;
}
