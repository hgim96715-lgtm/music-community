'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { JacketPreviewModal } from '@/components/saved-cards/JacketPreviewModal';
import { SavedCardAlbumBook } from '@/components/saved-cards/SavedCardAlbumBook';
import { fetchPublicAlbum } from '@/lib/api';
import type { ApiSavedCard } from '@/lib/apiTypes';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function isPrivateAlbumError(message: string) {
  return message.includes('비공개');
}

export default function PublicAlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [nickname, setNickname] = useState('');
  const [cards, setCards] = useState<ApiSavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [privateOpen, setPrivateOpen] = useState(false);
  const [selected, setSelected] = useState<ApiSavedCard | null>(null);

  useEffect(() => {
    if (!id) return;
    if (me?.id === id) {
      window.location.replace('/users/me/album');
      return;
    }
    let canceled = false;
    async function load() {
      setLoading(true);
      setError('');
      setPrivateOpen(false);
      try {
        const album = await fetchPublicAlbum(id);
        if (!canceled) {
          setNickname(album.user.nickname);
          setCards(album.items);
        }
      } catch (err) {
        if (!canceled) {
          const message =
            err instanceof Error ? err.message : '앨범을 불러오지 못했어요.';
          if (isPrivateAlbumError(message)) {
            setPrivateOpen(true);
            setError('');
          } else {
            setError(message);
          }
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    void load();
    return () => {
      canceled = true;
    };
  }, [id, me?.id]);

  function leavePrivate() {
    setPrivateOpen(false);
    router.replace(`/users/${id}`);
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div>
        <Link
          href={`/users/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80">
          <ChevronLeft className="size-4" aria-hidden />
          프로필
        </Link>
      </div>
      <h1 className="text-lg font-semibold text-brand-primary">
        {nickname ? `@${nickname}의 앨범` : '앨범'}
      </h1>
      {loading ? (
        <Loader2 className="mx-auto mt-10 size-6 animate-spin text-brand-primary" />
      ) : privateOpen ? (
        <p className="mt-6 text-center text-sm text-neutral-500">
          이 앨범은 비공개예요.
        </p>
      ) : (
        <SavedCardAlbumBook
          heading={nickname ? `@${nickname}의 앨범` : '앨범'}
          cards={cards}
          loading={false}
          error={error}
          editable={false}
          onSelectCard={setSelected}
          onCardsChange={() => {}}
        />
      )}
      <JacketPreviewModal jacket={selected} onClose={() => setSelected(null)} />
      <FeedDialog
        open={privateOpen}
        title="비공개 앨범"
        description="이 앨범은 비공개예요. 주인이 공개로 바꾸면 볼 수 있어요."
        confirmLabel="프로필로"
        cancelLabel="닫기"
        onConfirm={leavePrivate}
        onClose={leavePrivate}
      />
    </main>
  );
}
