import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '@/app/friends/action';
import { auth } from '@/auth';
import type {
  ApiFriendRequests,
  ApiFriendship,
  ApiPublicProfile,
} from '@/lib/apiTypes';
import { friendsFetchJson } from '@/lib/friendsFetch';
import { friendRelationWith } from '@/lib/friendsUtils';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchPublicProfile(
  userId: string,
): Promise<ApiPublicProfile | null> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL이 설정되지 않았습니다. 확인해주세요!');
  }
  const res = await fetch(`${API_URL}/users/${userId}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `API 요청실패 GET /users/${userId} 응답코드: ${res.status}`,
    );
  }
  return res.json() as Promise<ApiPublicProfile>;
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const user = await fetchPublicProfile(id);

  if (!user) notFound();

  const myId = session?.user?.id;
  let relation = friendRelationWith(myId, user.id, [], {
    received: [],
    sent: [],
  });

  if (myId && myId !== user.id) {
    const [friends, requests] = await Promise.all([
      friendsFetchJson<ApiFriendship[]>('/friends', { cache: 'no-store' }),
      friendsFetchJson<ApiFriendRequests>('/friends/requests', {
        cache: 'no-store',
      }),
    ]);
    relation = friendRelationWith(myId, user.id, friends, requests);
  }

  const displayName = user.nickname ? `@${user.nickname}` : '미설정';

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeftIcon className="size-4" aria-hidden />
          피드
        </Link>

        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- OAuth 등 외부 프로필 이미지 URL
              <img
                src={user.image}
                alt=""
                className="size-14 shrink-0 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-lg font-semibold text-neutral-500"
                aria-hidden>
                {(user.nickname?.[0] ?? '?').toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-neutral-900">
                {displayName}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">프로필</p>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-6">
            {relation.relation === 'self' && (
              <Link
                href="/profile"
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                마이페이지에서 수정
              </Link>
            )}

            {relation.relation === 'guest' && (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/user/${user.id}`)}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                로그인 후 친구 추가
              </Link>
            )}

            {relation.relation === 'none' && (
              <form action={sendFriendRequest.bind(null, user.id)}>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
                  친구 추가
                </button>
              </form>
            )}

            {relation.relation === 'pending_sent' && (
              <div className="space-y-3">
                <p className="text-center text-sm text-neutral-600">
                  친구 요청을 보냈습니다.
                </p>
                <form action={removeFriend.bind(null, user.id)}>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    요청 취소
                  </button>
                </form>
                <Link
                  href="/friends/requests"
                  className="block text-center text-sm text-neutral-600 hover:underline">
                  친구 요청 목록
                </Link>
              </div>
            )}

            {relation.relation === 'pending_received' &&
              relation.friendshipId && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-neutral-600">
                    친구 요청이 왔습니다.
                  </p>
                  <div className="flex gap-2">
                    <form
                      action={acceptFriendRequest.bind(
                        null,
                        relation.friendshipId,
                      )}
                      className="flex-1">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
                        수락
                      </button>
                    </form>
                    <form
                      action={declineFriendRequest.bind(
                        null,
                        relation.friendshipId,
                      )}
                      className="flex-1">
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                        거절
                      </button>
                    </form>
                  </div>
                </div>
              )}

            {relation.relation === 'friends' && (
              <div className="space-y-3">
                <p className="text-center text-sm text-neutral-600">
                  이미 친구입니다.
                </p>
                <Link
                  href="/friends"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  친구 목록
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
