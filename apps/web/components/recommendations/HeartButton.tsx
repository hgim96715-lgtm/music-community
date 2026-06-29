'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { authFetchApi, authFetchApiVoid } from '@/lib/authFetch';
import { Heart } from 'lucide-react';
import { ACTION_BTN, ACTION_ICON, COUNT_SLOT } from '@/lib/feedCardActions';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';

type HeartButtonProps = {
  recommendationId: string;
  likedByMe?: boolean;
  likeCount: number;
};

export function HeartButton({
  recommendationId,
  likedByMe,
  likeCount: initialLikeCount,
}: HeartButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isPending, setIsPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setLiked(likedByMe ?? false);
  }, [likedByMe]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const heartClassName = liked
    ? 'fill-red-500 text-red-500'
    : likeCount > 0
      ? 'fill-neutral-400 text-neutral-400'
      : 'text-neutral-400';

  async function handleClick() {
    if (!user) {
      setDialogOpen(true);
      return;
    }
    if (isPending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => (nextLiked ? count + 1 : count - 1));
    setIsPending(true);
    try {
      const path = `/recommendations/${recommendationId}/reactions`;
      if (nextLiked) {
        await authFetchApi(path, { method: 'POST' });
      } else {
        await authFetchApiVoid(path, { method: 'DELETE' });
      }
    } catch {
      setLiked(!nextLiked);
      setLikeCount((count) => (nextLiked ? count - 1 : count + 1));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {user?.role === 'admin' ? (
        <div
          className={`${ACTION_BTN} pointer-events-none text-neutral-400`}
          aria-label={`좋아요 ${likeCount}개`}>
          <Heart
            className={`${ACTION_ICON} text-neutral-300`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className={`${COUNT_SLOT} text-neutral-500`}>{likeCount}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
          aria-pressed={liked}
          className={`${ACTION_BTN} text-neutral-500 hover:text-neutral-800 disabled:opacity-50`}>
          <Heart
            className={`${ACTION_ICON} ${heartClassName}`}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className={`${COUNT_SLOT} text-neutral-600`}>{likeCount}</span>
        </button>
      )}
      <LoginPromptDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        redirectPath="/recommendations"
        title="로그인이 필요해요"
        description="좋아요를 남기려면 로그인해 주세요."
      />
    </>
  );
}
