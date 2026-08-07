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
  fetchPublicUser,
  removeFriend,
  respondFriendRequest,
  unblockUser,
} from '@/lib/api';
import type { ApiFriendRequests, ApiFriendship } from '@/lib/apiTypes';
import { openOrGetDm } from '@/lib/dms';
import {
  friendRelationLabel,
  friendRelationWith,
  type FriendRelation,
} from '@/lib/friendsUtils';
import { kickRoomMember, transferRoom } from '@/lib/rooms';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type AvatarActionTarget = {
  id: string;
  nickname: string;
  roomId?: string;
  roomOwnerId?: string;
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

  const [kickOpen, setKickOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [privateAlbumOpen, setPrivateAlbumOpen] = useState(false);

  const [albumVisibility, setAlbumVisibility] = useState<
    'private' | 'public' | null
  >(null);

  const load = useCallback(async () => {
    if (!target) {
      setFriends([]);
      setRequests({ received: [], sent: [] });
      setBlockedByMe(false);
      setAlbumVisibility(null);
      return;
    }
    try {
      const publicUser = await fetchPublicUser(target.id);
      setAlbumVisibility(publicUser.albumVisibility ?? 'private');

      if (!user) {
        setFriends([]);
        setRequests({ received: [], sent: [] });
        setBlockedByMe(false);
        return;
      }
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
      setAlbumVisibility(null);
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

  const canOwnerActions = Boolean(
    user &&
    target.roomId &&
    target.roomOwnerId &&
    user.id === target.roomOwnerId &&
    target.id !== user.id,
  );

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
        {relation !== 'self' ? (
          <AvatarActionRow
            label="앨범 방문하기"
            onClick={() => {
              if (albumVisibility === 'public') {
                onClose();
                router.push(`/users/${target.id}/album`);
                return;
              }
              setPrivateAlbumOpen(true);
            }}
          />
        ) : null}

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

        {!blockedByMe && relation !== 'guest' && relation !== 'self' ? (
          <AvatarActionRow
            label={relation === 'friends' ? '메시지 보내기' : '메시지 요청'}
            onClick={() =>
              void (async () => {
                setBusy(true);
                setError('');
                try {
                  const dm = await openOrGetDm(target.id);
                  onClose();
                  router.push(`/messages/${dm.id}`);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : '메시지를 열지 못했어요.',
                  );
                } finally {
                  setBusy(false);
                }
              })()
            }
          />
        ) : null}

        {!blockedByMe && relation === 'friends' ? (
          <AvatarActionRow
            label="친구 끊기"
            danger
            onClick={() => setUnfriendOpen(true)}
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

        {canOwnerActions ? (
          <>
            <AvatarActionRow
              label="방장 넘기기"
              onClick={() => setTransferOpen(true)}
            />
            <AvatarActionRow
              label="내보내기"
              danger
              onClick={() => setKickOpen(true)}
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
        open={privateAlbumOpen}
        title="비공개 앨범"
        description="이 앨범은 비공개예요. 주인이 공개로 바꾸면 볼 수 있어요."
        confirmLabel="확인"
        cancelLabel="닫기"
        onConfirm={() => setPrivateAlbumOpen(false)}
        onClose={() => setPrivateAlbumOpen(false)}
      />

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
      <FeedDialog
        open={kickOpen}
        title={`@${target.nickname}님을 내보낼까요?`}
        description="이 방에 다시 들어올 수 없어요."
        confirmLabel="내보내기"
        pendingLabel="내보내는 중…"
        isPending={busy}
        onClose={() => !busy && setKickOpen(false)}
        onConfirm={() => {
          void (async () => {
            if (!target.roomId) return;
            setBusy(true);
            setError('');
            try {
              await kickRoomMember(target.roomId, target.id);
              setKickOpen(false);
              onClose();
              onChanged?.();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : '내보내기에 실패했습니다.',
              );
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <FeedDialog
        open={transferOpen}
        title={`@${target.nickname}님에게 방장을 넘길까요?`}
        description="넘기면 이 방 방장 권한이 상대에게 갑니다."
        confirmLabel="방장 넘기기"
        pendingLabel="넘기는 중…"
        isPending={busy}
        onClose={() => !busy && setTransferOpen(false)}
        onConfirm={() => {
          void (async () => {
            if (!target.roomId) return;
            setBusy(true);
            setError('');
            try {
              await transferRoom(target.roomId, target.id);
              setTransferOpen(false);
              onClose();
              onChanged?.();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : '방장 넘기기에 실패했습니다.',
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
