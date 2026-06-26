'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { authFetchApi, authFetchApiVoid } from '@/lib/authFetch';
import { Heart } from 'lucide-react';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';

type HeartButtonProps = {
  recommendationId: string;
  likedByMe?: boolean;
  likeCount: number;
};

/** 숫자 자릿수 바뀌어도 옆 아이콘이 밀리지 않게 고정 너비 */
const COUNT_SLOT =
  'inline-block min-w-[1.25rem] text-left text-sm tabular-nums';

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
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={liked ? '좋아요 취소' : '좋아요'}
        aria-pressed={liked}
        className="inline-flex h-9 min-w-[3.25rem] shrink-0 items-center justify-start gap-1 rounded-full px-1 text-neutral-500 transition-colors hover:text-neutral-800 disabled:opacity-50">
        <Heart className={`h-5 w-5 shrink-0 ${heartClassName}`} aria-hidden />
        <span className={`${COUNT_SLOT} text-neutral-600`}>{likeCount}</span>
      </button>
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
