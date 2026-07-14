'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  AvatarActionRow,
  AvatarActionSheet,
} from '@/components/friends/AvatarActionSheet';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import {
  blockUser,
  createFriendRequest,
  fetchBlockStatus,
  fetchFriendRequests,
  fetchFriends,
  removeFriend,
  respondFriendRequest,
  unblockUser,
} from '@/lib/api';
import type { ApiFriendRequests, ApiFriendship } from '@/lib/apiTypes';
import {
  friendRelationLabel,
  friendRelationWith,
  type FriendRelation,
} from '@/lib/friendsUtils';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type AvatarActionTarget = {
  id: string;
  nickname: string;
};

type Props = {
  open: boolean;
  target: AvatarActionTarget | null;
  onClose: () => void;
  /** 친구/차단 바뀐 뒤 (칩 갱신 등) */
  onChanged?: () => void;
};

export function AvatarActionSheetHost({
  open,
  target,
  onClose,
  onChanged,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<ApiFriendship[]>([]);
  const [requests, setRequests] = useState<ApiFriendRequests>({
    received: [],
    sent: [],
  });
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unfriendOpen, setUnfriendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const load = useCallback(async () => {
    if (!target || !user) {
      setFriends([]);
      setRequests({ received: [], sent: [] });
      setBlockedByMe(false);
      return;
    }
    try {
      const [friendsList, requestList, blockStatus] = await Promise.all([
        fetchFriends(),
        fetchFriendRequests(),
        fetchBlockStatus(target.id),
      ]);
      setFriends(friendsList);
      setRequests(requestList);
      setBlockedByMe(blockStatus.blockedByMe);
    } catch {
      setFriends([]);
      setRequests({ received: [], sent: [] });
      setBlockedByMe(false);
    }
  }, [target, user]);

  useEffect(() => {
    if (!open || !target) return;
    setError('');
    void load();
  }, [open, target, load]);

  const relation: FriendRelation = target
    ? friendRelationWith({
        myId: user?.id ?? null,
        profileUserId: target.id,
        friends,
        requests,
      })
    : 'guest';

  const pendingFriendshipId =
    relation === 'pending_received'
      ? requests.received.find((f) => f.requesterId === target?.id)?.id
      : undefined;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      onChanged?.();
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : '요청에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  function goProfile() {
    if (!target) return;
    onClose();
    if (relation === 'self') {
      router.push('/users/me');
      return;
    }
    router.push(`/users/${target.id}`);
  }

  if (!target) return null;

  return (
    <>
      <AvatarActionSheet
        open={open}
        onClose={onClose}
        nickname={target.nickname}
        relationLabel={friendRelationLabel(relation, blockedByMe)}>
        {error ? (
          <p className="px-4 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <AvatarActionRow
          label={relation === 'self' ? '마이페이지로 이동' : '프로필 방문'}
          onClick={goProfile}
        />

        {relation === 'guest' ? (
          <AvatarActionRow
            label="로그인하고 친구 추가"
            onClick={() => {
              onClose();
              router.push(`/login?next=/users/${target.id}`);
            }}
          />
        ) : null}

        {blockedByMe ? (
          <AvatarActionRow
            label="차단 해제"
            onClick={() => void run(() => unblockUser(target.id))}
          />
        ) : null}

        {!blockedByMe && relation === 'none' ? (
          <AvatarActionRow
            label="친구 추가"
            onClick={() => void run(() => createFriendRequest(target.id))}
          />
        ) : null}

        {!blockedByMe && relation === 'pending_sent' ? (
          <AvatarActionRow
            label="요청 취소"
            onClick={() => void run(() => removeFriend(target.id))}
          />
        ) : null}

        {!blockedByMe &&
        relation === 'pending_received' &&
        pendingFriendshipId ? (
          <>
            <AvatarActionRow
              label="수락"
              onClick={() =>
                void run(() =>
                  respondFriendRequest(pendingFriendshipId, 'accept'),
                )
              }
            />
            <AvatarActionRow
              label="거절"
              onClick={() =>
                void run(() =>
                  respondFriendRequest(pendingFriendshipId, 'decline'),
                )
              }
            />
          </>
        ) : null}

        {!blockedByMe && relation === 'friends' ? (
          <>
            <AvatarActionRow label="메시지 보내기" disabled />
            <AvatarActionRow
              label="친구 끊기"
              danger
              onClick={() => setUnfriendOpen(true)}
            />
          </>
        ) : null}

        {!blockedByMe && relation !== 'guest' && relation !== 'self' ? (
          <AvatarActionRow
            label="차단"
            danger
            onClick={() => setBlockOpen(true)}
          />
        ) : null}
      </AvatarActionSheet>

      <FeedDialog
        open={unfriendOpen}
        title="친구를 끊을까요?"
        description="다시 만나려면 친구 요청이 필요해요."
        confirmLabel="친구 끊기"
        pendingLabel="끊는 중…"
        isPending={busy}
        onClose={() => !busy && setUnfriendOpen(false)}
        onConfirm={() => {
          void (async () => {
            setBusy(true);
            setError('');
            try {
              await removeFriend(target.id);
              setUnfriendOpen(false);
              onChanged?.();
              await load();
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : '친구 끊기에 실패했습니다.',
              );
            } finally {
              setBusy(false);
            }
          })();
        }}
      />

      <FeedDialog
        open={blockOpen}
        title="이 사용자를 차단할까요?"
        description="친구 요청·댓글이 막히고, 기존 친구 관계도 정리돼요."
        confirmLabel="차단"
        pendingLabel="차단 중…"
        isPending={busy}
        onClose={() => !busy && setBlockOpen(false)}
        onConfirm={() => {
          void (async () => {
            setBusy(true);
            setError('');
            try {
              await blockUser(target.id);
              setBlockOpen(false);
              onChanged?.();
              await load();
            } catch (error) {
              setError(
                error instanceof Error ? error.message : '차단에 실패했습니다.',
              );
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
    </>
  );
}
