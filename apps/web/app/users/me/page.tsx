'use client';
import { SavedCardAlbumBook } from '@/components/saved-cards/SavedCardAlbumBook';
import { SavedCardAlbumModal } from '@/components/saved-cards/SavedCardAlbumModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import {
  fetchFriendRequests,
  fetchFriends,
  fetchSavedCards,
  patchUserProfile,
} from '@/lib/api';
import type { ApiSavedCard } from '@/lib/apiTypes';
import {
  appNavLinkClassName,
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
  formLegendClassName,
} from '@/lib/form';
import { postCardShell, postCard } from '@/lib/neobrutal';
import { ChevronLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState<ApiSavedCard[]>([]);
  const [albumLoading, setAlbumLoading] = useState(true);
  const [albumError, setAlbumError] = useState('');
  const [selected, setSelected] = useState<ApiSavedCard | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [friendsOpen, setFriendsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setAlbumLoading(true);
    setAlbumError('');

    fetchSavedCards()
      .then((cards) => {
        if (!cancelled) setSavedCards(cards);
      })
      .catch((err) => {
        if (!cancelled) {
          setAlbumError(
            err instanceof Error ? err.message : '앨범을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setAlbumLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    Promise.all([fetchFriends(), fetchFriendRequests()])
      .then(([friendsList, requests]) => {
        if (cancelled) return;
        setFriendCount(friendsList.length);
        setRequestCount(requests.received.length + requests.sent.length);
      })
      .catch(() => {
        /* 카운터 실패는 프로필을 막지 않음 */
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  function startEditing() {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
    setError('');
    setIsEditing(false);
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const updated = await patchUserProfile({
        nickname: nickname.trim(),
        bio: bio.trim() || null,
      });
      setUser({ ...user, ...updated });
      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '프로필 업데이트에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };
  if (isLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }
  return (
    <main className={`${authPageClassName} gap-8`}>
      <div>
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
      </div>

      {isEditing ? (
        <section className="flex flex-col gap-4">
          <h1 className={authTitleClassName}>프로필 수정</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={formLegendClassName}>닉네임</label>
              <PillInput
                label="닉네임"
                name="nickname"
                icon={User}
                value={nickname}
                onChange={setNickname}
                autoComplete="username"
              />
            </div>
            <div>
              <label className={formLegendClassName}>한 줄 소개</label>
              <PillTextarea
                label="한 줄 소개"
                name="bio"
                placeholder="없어도 괜찮아요"
                value={bio}
                onChange={setBio}
                rows={3}
              />
            </div>
            {error ? <p className={fieldErrorClassName}>{error}</p> : null}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={saving}
                className={authSubmitClassName}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : '저장'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className={appNavLinkClassName}>
                취소
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className={`${postCardShell} w-full`}>
          <div
            className={`${postCard} flex flex-col items-center gap-3 px-6 py-8 text-center`}>
            <div
              className="flex size-16 items-center justify-center rounded-full border-2 border-brand-border bg-brand-primary-soft text-brand-primary shadow-[3px_3px_0_var(--color-brand-shadow-soft)]"
              aria-hidden>
              <User className="size-7" />
            </div>
            <div>
              <h1 className={authTitleClassName}>@{user.nickname}</h1>
              {user.bio ? (
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-2 text-sm text-neutral-400">
                  한 줄 소개가 없어요
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={startEditing}
              className={`${appNavLinkClassName} border-2 border-brand-border bg-white px-4 py-2 shadow-[2px_2px_0_var(--color-brand-shadow-soft)]`}>
              프로필 수정
            </button>

            <div className="mt-1 w-full border-t border-neutral-200/80 pt-3">
              <button
                type="button"
                aria-expanded={friendsOpen}
                onClick={() => setFriendsOpen((open) => !open)}
                className="w-full text-sm font-medium text-neutral-700 transition-colors hover:text-brand-primary">
                친구
                {friendCount > 0 ? ` ${friendCount}` : ''}
                {requestCount > 0 ? ` · 요청 ${requestCount}` : ''}
              </button>
              {friendsOpen ? (
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/friends" className={appNavLinkClassName}>
                      친구 목록
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/friends/requests"
                      className={appNavLinkClassName}>
                      친구 요청
                    </Link>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      )}
      <section>
        <SavedCardAlbumBook
          cards={savedCards}
          loading={albumLoading}
          error={albumError}
          onSelectCard={setSelected}
          onCardsChange={setSavedCards}
        />
      </section>

      <SavedCardAlbumModal
        card={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onDeleted={(id) => {
          setSavedCards((prev) => prev.filter((c) => c.id !== id));
          setSelected(null);
        }}
        onUpdated={(updated) => {
          setSavedCards((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
          );
          setSelected(updated);
        }}
      />
    </main>
  );
}
