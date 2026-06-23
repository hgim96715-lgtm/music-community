import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProfileNicknameForm from './components/ProfileNicknameForm';

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, email: true },
  });
  if (!user) {
    notFound();
  }

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">마이페이지</h1>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-sm font-medium text-neutral-700">닉네임</dt>
            <dd className="mt-1 text-sm text-neutral-900">
              {user.nickname ? `@${user.nickname}` : '미설정'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-neutral-700">이메일</dt>
            <dd className="mt-1 text-sm text-neutral-600">
              {user.email ?? '-'}
            </dd>
          </div>
        </dl>

        <ProfileNicknameForm currentNickname={user.nickname ?? ''} />
      </div>
    </main>
  );
}
