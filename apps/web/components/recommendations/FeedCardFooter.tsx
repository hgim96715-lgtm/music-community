'use client';

import { MessageCircle, Share2 } from 'lucide-react';
import {
  ACTION_BTN,
  ACTION_ICON,
  COUNT_SLOT,
} from '@/lib/feedCardActions';
import { MoodPill } from './MoodPill';
import { HeartButton } from './HeartButton';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';
import { useAuth } from '../auth/AuthProvider';
import { SubmitEventHandler, useState } from 'react';

type FeedCardFooterProps = {
  recommendationId: string;
  moods: string[];
  likeCount: number;
  likedByMe?: boolean;
  commentCount?: number;
};

type ActionCountProps = {
  icon: typeof MessageCircle;
  count: number;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ActionCount({
  icon: Icon,
  count,
  label,
  active,
  onClick,
}: ActionCountProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`${ACTION_BTN} ${
        active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
      }`}>
      <Icon
        className={`${ACTION_ICON} ${active ? 'fill-neutral-700/15' : ''}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className={COUNT_SLOT}>{count}</span>
    </button>
  );
}

export function FeedCardFooter({
  recommendationId,
  moods,
  likeCount,
  likedByMe,
  commentCount = 0,
}: FeedCardFooterProps) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  async function handleShare() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/recommendations/${recommendationId}`
        : `/recommendations/${recommendationId}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ url, title: 'Music Community' });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint('링크를 복사했어요');
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint('공유를 취소했어요');
      window.setTimeout(() => setShareHint(null), 2000);
    }
  }

  function toggleComments() {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    setCommentsOpen((v) => !v);
  }

  const handleCommentSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!commentDraft.trim()) return;
    setCommentDraft('');
    setShareHint('댓글 API 연동 전 — UI만 보여요');
    window.setTimeout(() => setShareHint(null), 2500);
  };

  return (
    <footer className="mt-2">
      {moods.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {moods.map((mood) => (
            <MoodPill key={mood} mood={mood} />
          ))}
        </div>
      ) : null}

      <div
        className={`flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 ${
          moods.length > 0 ? 'mt-4' : 'mt-3'
        }`}>
        <div className="flex items-center">
          <HeartButton
            recommendationId={recommendationId}
            likedByMe={likedByMe}
            likeCount={likeCount}
          />
          <ActionCount
            icon={MessageCircle}
            count={commentCount}
            label={commentsOpen ? '댓글 접기' : '댓글'}
            active={commentsOpen}
            onClick={toggleComments}
          />
          <button
            type="button"
            onClick={handleShare}
            aria-label="공유"
            className={`${ACTION_BTN} text-neutral-500 hover:text-neutral-800`}>
            <Share2 className={ACTION_ICON} strokeWidth={1.75} aria-hidden />
            <span className={`${COUNT_SLOT} invisible`} aria-hidden>
              0
            </span>
          </button>
        </div>
        {shareHint ? (
          <span className="shrink-0 font-sans text-xs text-neutral-400">
            {shareHint}
          </span>
        ) : null}
      </div>

      {commentsOpen ? (
        <section
          aria-label="댓글"
          className="mt-4 border-t border-neutral-200/60 pt-4">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="댓글을 입력해 주세요"
              className="min-w-0 flex-1 rounded-full border border-neutral-200/80 bg-white/60 px-3 py-2 font-sans text-sm backdrop-blur-sm placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!commentDraft.trim()}
              className="shrink-0 rounded-full bg-neutral-800 px-3 py-2 font-sans text-sm font-medium text-white disabled:opacity-40">
              등록
            </button>
          </form>
          {commentCount === 0 ? (
            <p className="mt-3 text-center font-sans text-xs text-neutral-400">
              아직 댓글이 없어요
            </p>
          ) : null}
          <p className="mt-2 text-center font-sans text-[11px] text-neutral-400">
            댓글 저장 API — 추후 연동 (UI 미리보기)
          </p>
        </section>
      ) : null}

      <LoginPromptDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        redirectPath="/recommendations"
        title="로그인이 필요해요"
        description="댓글을 남기려면 로그인해 주세요."
      />
    </footer>
  );
}
