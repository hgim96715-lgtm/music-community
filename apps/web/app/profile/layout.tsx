import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/profile');
  }
  return children;
}
