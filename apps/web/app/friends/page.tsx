import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ApiFriendship } from '@/lib/apiTypes';
import { friendsFetchJson } from '@/lib/friendsFetch';
import { otherUser } from '@/lib/friendsUtils';
import { removeFriend } from './action';

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const friends = await friendsFetchJson<ApiFriendship[]>('/friends', {
    cache: 'no-store',
  });

  const myId = session.user.id;

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">친구</h1>
          <Link
            href="/friends/requests"
            className="text-sm text-neutral-600 hover:underline">
            친구 요청
          </Link>
        </div>

        {friends.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">아직 친구가 없습니다.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {friends.map((f) => {
              const user = otherUser(f, myId);
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>@{user.nickname}</span>
                  <form action={removeFriend.bind(null, user.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      친구 끊기
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
