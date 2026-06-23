import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ApiFriendRequests } from '@/lib/apiTypes';
import { friendsFetchJson } from '@/lib/friendsFetch';
import { otherUser } from '@/lib/friendsUtils';
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../action';

export default async function FriendRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { received, sent } = await friendsFetchJson<ApiFriendRequests>(
    '/friends/requests',
    { cache: 'no-store' },
  );

  const myId = session.user.id;

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">친구 요청</h1>
          <Link
            href="/friends"
            className="text-sm text-neutral-600 hover:underline">
            친구 목록
          </Link>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-neutral-700">받은 요청</h2>
          {received.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              받은 요청이 없습니다.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
              {received.map((f) => {
                const user = otherUser(f, myId);
                return (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span>@{user.nickname}</span>
                    <div className="flex gap-2">
                      <form action={acceptFriendRequest.bind(null, f.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                          수락
                        </button>
                      </form>
                      <form action={declineFriendRequest.bind(null, f.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                          거절
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-neutral-700">보낸 요청</h2>
          {sent.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              보낸 요청이 없습니다.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
              {sent.map((f) => {
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
                        취소
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
