import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/server';

export default async function Dashboard() {
  await requireSession();
  redirect('/dashboard/overview');
}
