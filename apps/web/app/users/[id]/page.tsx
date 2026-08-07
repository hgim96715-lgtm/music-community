'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { AlbumPublicStamp } from '@/components/saved-cards/AlbumPublicStamp';
import { JacketPreviewModal } from '@/components/saved-cards/JacketPreviewModal';
import { SavedCardAlbumBook } from '@/components/saved-cards/SavedCardAlbumBook';
import { UserProfileActions } from '@/components/users/UserProfileActions';
import {
  fetchBlockStatus,
  fetchFriendRequests,
  fetchFriends,
  fetchPublicAlbum,
  fetchPublicUser,
} from '@/lib/api';
import type {
  ApiFriendRequests,
  ApiFriendship,
  ApiPublicUser,
  ApiSavedCard,
} from '@/lib/apiTypes';
import { friendRelationWith } from '@/lib/friendsUtils';
import {
  appNavLinkClassName,
  authPageClassName,
  authTitleClassName,
} from '@/lib/form';
import { postCard, postCardShell } from '@/lib/neobrutal';
import { ChevronLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PublicUserPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ApiPublicUser | null>(null);
  const [friends, setFriends] = useState<ApiFriendship[]>([]);
  const [requests, setRequests] = useState<ApiFriendRequests>({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockedByMe, setBlockedByMe] = useState(false);

  const [albumCards, setAlbumCards] = useState<ApiSavedCard[]>([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [selected, setSelected] = useState<ApiSavedCard | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const publicUser = await fetchPublicUser(id);
      setProfile(publicUser);
      if (publicUser.albumVisibility === 'public') {
        setAlbumLoading(true);
        try {
          const album = await fetchPublicAlbum(publicUser.id);
          setAlbumCards(album.items);
        } catch {
          setAlbumCards([]);
        } finally {
          setAlbumLoading(false);
        }
      } else {
        setAlbumCards([]);
        setAlbumLoading(false);
      }
      if (user) {
        const [friendsList, requestList, blockStatus] = await Promise.all([
          fetchFriends(),
          fetchFriendRequests(),
          fetchBlockStatus(id),
        ]);
        setFriends(friendsList);
        setRequests(requestList);
        setBlockedByMe(blockStatus.blockedByMe);
      } else {
        setFriends([]);
        setRequests({ received: [], sent: [] });
        setBlockedByMe(false);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '프로필을 불러오는데 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const myId = user?.id ?? null;
  const relation = profile
    ? friendRelationWith({ myId, profileUserId: profile.id, friends, requests })
    : 'guest';
  const pendingFriendshipId =
    relation === 'pending_received'
      ? requests.received.find((f) => f.requesterId === profile?.id)?.id
      : undefined;
  if (authLoading || loading) {
    return (
      <div className={`${authPageClassName} items-center justify-center`}>
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className={authPageClassName}>
        <Link href="/recommendations" className={appNavLinkClassName}>
          <ChevronLeft className="inline size-4" /> 피드로
        </Link>
        <p className="mt-8 text-sm text-red-600">
          {error || '유저를 찾을 수 없습니다.'}
        </p>
      </div>
    );
  }
  return (
    <div className={authPageClassName}>
      <Link href="/recommendations" className={appNavLinkClassName}>
        <ChevronLeft className="inline size-4" /> 피드로
      </Link>
      <section className={`${postCardShell} mt-8 w-full`}>
        <div
          className={`${postCard} flex flex-col items-center gap-3 px-6 py-8 text-center`}>
          <div
            className="flex size-16 items-center justify-center rounded-full border-2 border-brand-border bg-brand-primary-soft text-brand-primary shadow-[3px_3px_0_var(--color-brand-shadow-soft)]"
            aria-hidden>
            <User className="size-7" />
          </div>
          <div>
            <div className="inline-flex flex-wrap items-center justify-center gap-2">
              <h1 className={authTitleClassName}>@{profile.nickname}</h1>
              {profile.albumVisibility === 'public' ? (
                <AlbumPublicStamp />
              ) : null}
            </div>
            {profile.bio ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">
                한 줄 소개가 없어요
              </p>
            )}
          </div>
          <div className="mt-2 w-full max-w-xs">
            <UserProfileActions
              relation={relation}
              profileUserId={profile.id}
              pendingFriendshipId={pendingFriendshipId}
              blockedByMe={blockedByMe}
              onChanged={load}
            />
          </div>
        </div>
      </section>
      {profile.albumVisibility === 'public' ? (
        <section className="mt-6 w-full">
          {albumLoading ? (
            <Loader2 className="mx-auto size-6 animate-spin text-brand-primary" />
          ) : (
            <SavedCardAlbumBook
              heading={`@${profile.nickname}의 앨범`}
              cards={albumCards}
              loading={false}
              error=""
              editable={false}
              onSelectCard={setSelected}
              onCardsChange={() => {}}
            />
          )}
        </section>
      ) : (
        <p className="mt-6 text-center text-sm text-neutral-500">
          비공개 앨범이에요
        </p>
      )}
      <JacketPreviewModal jacket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
