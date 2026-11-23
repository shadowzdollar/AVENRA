import type { Metadata } from 'next';
import { DocsExperience } from '@/features/marketing/docs-experience';

export const metadata: Metadata = {
  title: 'Documentation & API Explorer | Avenra',
  description:
    'Interactive OpenAPI 3.1 endpoint explorer, copyable cURL requests, and Architecture Decision Records (ADRs).'
};

export default function DocsPage() {
  return <DocsExperience />;
}
