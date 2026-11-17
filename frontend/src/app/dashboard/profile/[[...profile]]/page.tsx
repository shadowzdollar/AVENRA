import { requireSession } from '@/lib/auth/server';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  await requireSession();

  return <ProfileViewPage />;
}
