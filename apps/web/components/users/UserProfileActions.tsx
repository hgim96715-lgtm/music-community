'use client';

import { FeedDialog } from '@/components/recommendations/FeedDialog';
import {
  createFriendRequest,
  removeFriend,
  respondFriendRequest,
} from '@/lib/api';
import type { FriendRelation } from '@/lib/friendsUtils';
import { authSubmitClassName } from '@/lib/form';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  relation: FriendRelation;
  profileUserId: string;
  /** pending_received 수락·거절용 Friendship.id */
  pendingFriendshipId?: string;
  onChanged: () => void;
};

const btn =
  'inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50';

export function UserProfileActions({
  relation,
  profileUserId,
  pendingFriendshipId,
  onChanged,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unfriendOpen, setUnfriendOpen] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmUnfriend() {
    setBusy(true);
    setError('');
    try {
      await removeFriend(profileUserId);
      setUnfriendOpen(false);
      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '친구 끊기에 실패했습니다.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (relation === 'guest') {
    return (
      <Link
        href={`/login?next=/users/${profileUserId}`}
        className={authSubmitClassName}>
        로그인하고 친구 추가
      </Link>
    );
  }
  if (relation === 'self') {
    return (
      <Link href="/users/me" className={btn}>
        마이페이지에서 수정
      </Link>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {relation === 'none' ? (
        <button
          type="button"
          disabled={busy}
          className={authSubmitClassName}
          onClick={() => void run(() => createFriendRequest(profileUserId))}>
          친구 추가
        </button>
      ) : null}
      {relation === 'pending_sent' ? (
        <button
          type="button"
          disabled={busy}
          className={btn}
          onClick={() => void run(() => removeFriend(profileUserId))}>
          요청 보냄 · 취소
        </button>
      ) : null}
      {relation === 'pending_received' && pendingFriendshipId ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            className={authSubmitClassName}
            onClick={() =>
              void run(() =>
                respondFriendRequest(pendingFriendshipId, 'accept'),
              )
            }>
            수락
          </button>
          <button
            type="button"
            disabled={busy}
            className={btn}
            onClick={() =>
              void run(() =>
                respondFriendRequest(pendingFriendshipId, 'decline'),
              )
            }>
            거절
          </button>
        </div>
      ) : null}
      {relation === 'friends' ? (
        <div className="flex flex-col gap-2">
          <Link href="/friends" className={btn}>
            이미 친구 · 친구 목록
          </Link>
          <button
            type="button"
            disabled={busy}
            className={`${btn} text-red-600`}
            onClick={() => setUnfriendOpen(true)}>
            친구 끊기
          </button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <FeedDialog
        open={unfriendOpen}
        title="친구를 끊을까요?"
        description="다시 만나려면 친구 요청이 필요해요."
        confirmLabel="친구 끊기"
        pendingLabel="끊는 중…"
        isPending={busy}
        onClose={() => !busy && setUnfriendOpen(false)}
        onConfirm={() => void confirmUnfriend()}
      />
    </div>
  );
}
