import type { Metadata } from 'next';
import { ContactExperience } from '@/features/marketing/contact-experience';

export const metadata: Metadata = {
  title: 'Contact Us | Avenra',
  description:
    'Book an enterprise demo, request a security & compliance review, or discuss multi-entity licensing with the Avenra advisory team.'
};

export default function ContactPage() {
  return <ContactExperience />;
}
