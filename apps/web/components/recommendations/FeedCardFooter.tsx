'use client';

import { MessageCircle, PencilIcon, Share2, Trash2 } from 'lucide-react';
import { ACTION_BTN, ACTION_ICON, COUNT_SLOT } from '@/lib/feedCardActions';
import { MoodPill } from './MoodPill';
import { HeartButton } from './HeartButton';
import { FeedCardSaveButton } from '@/components/saved-cards/FeedCardSaveButton';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';
import { useAuth } from '../auth/AuthProvider';
import { useEffect, useState } from 'react';
import {
  createComment,
  deleteComment,
  fetchComments,
  updateComment,
} from '@/lib/api';
import { ApiComment } from '@/lib/apiTypes';
import { formatCommentDate } from '@/lib/date';
import { brandPillBtn } from '@/lib/neobrutal';
import { FeedAuthorNickname } from '@/components/friends/FeedAuthorNickname';
import { CommentAvatar } from './CommentAvatar';
import { CommentEmojiPicker } from './CommentEmojiPicker';

type FeedCardFooterProps = {
  recommendationId: string;
  authorId: string;
  cardBackground?: string;
  title: string;
  artist: string;
  embedUrl: string;
  reason: string;
  moods: string[];
  postedAt: string;
  likeCount: number;
  likedByMe?: boolean;
  commentCount: number;
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
  authorId,
  cardBackground,
  title,
  artist,
  embedUrl,
  reason,
  moods,
  postedAt,
  likeCount,
  likedByMe,
  commentCount,
}: FeedCardFooterProps) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [displayedCommentCount, setDisplayedCommentCount] =
    useState(commentCount);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deletingPendingId, setDeletingPendingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setDisplayedCommentCount(commentCount);
  }, [commentCount]);

  function showHint(message: string) {
    setActionHint(message);
    window.setTimeout(() => setActionHint(null), 2000);
  }

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
      showHint('링크를 복사했어요');
    } catch {
      showHint('공유를 취소했어요');
    }
  }

  async function toggleComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    setCommentsLoading(true);
    try {
      const data = await fetchComments(recommendationId);
      setComments(data);
      setDisplayedCommentCount(data.length);
    } catch {
      setCommentsOpen(false);
      showHint('댓글을 불러오지 못했어요');
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleCommentSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    try {
      const created = await createComment(recommendationId, body);
      setComments((prev) => [...prev, created]);
      setDisplayedCommentCount((count) => count + 1);
      setCommentDraft('');
    } catch {
      showHint('댓글을 저장하지 못했어요');
    }
  }

  function startCommentEdit(comment: ApiComment) {
    setEditingCommentId(comment.id);
    setEditDraft(comment.body);
  }

  function cancelCommentEdit() {
    setEditingCommentId(null);
    setEditDraft('');
  }

  async function handleCommentUpdate(commentId: string) {
    const body = editDraft.trim();
    if (!body) return;
    try {
      setEditingPendingId(commentId);
      const updated = await updateComment(recommendationId, commentId, body);
      setComments((prev) =>
        prev.map((comment) => (comment.id === commentId ? updated : comment)),
      );
      cancelCommentEdit();
    } catch {
      showHint('댓글을 수정하지 못했어요');
    } finally {
      setEditingPendingId(null);
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    try {
      setDeletingPendingId(commentId);
      await deleteComment(recommendationId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setDisplayedCommentCount((count) => Math.max(0, count - 1));
      if (editingCommentId === commentId) cancelCommentEdit();
    } catch {
      showHint('댓글을 삭제하지 못했어요');
    } finally {
      setDeletingPendingId(null);
    }
  }

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
            count={displayedCommentCount}
            label={commentsOpen ? '댓글 접기' : '댓글'}
            active={commentsOpen}
            onClick={toggleComments}
          />
          <FeedCardSaveButton
            recommendationId={recommendationId}
            authorId={authorId}
            title={title}
            artist={artist}
            embedUrl={embedUrl}
            reason={reason}
            moods={moods}
            postedAt={postedAt}
            background={cardBackground}
            onHint={showHint}
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
        {actionHint ? (
          <span className="shrink-0 font-sans text-xs text-neutral-400">
            {actionHint}
          </span>
        ) : null}
      </div>

      {commentsOpen ? (
        <section
          aria-label="댓글"
          className="mt-4 border-t border-neutral-200/60 pt-4">
          {user ? (
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/70 py-1 pl-1 pr-1.5 shadow-[2px_2px_0_var(--color-brand-shadow-soft)] backdrop-blur-sm">
              <CommentEmojiPicker
                onPick={(emoji) => setCommentDraft((prev) => prev + emoji)}
              />
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="댓글을 입력해 주세요"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 font-sans text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentDraft.trim()}
                className={`${brandPillBtn} shrink-0 !px-3.5 !py-1.5 !text-xs disabled:opacity-40`}>
                등록
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setLoginDialogOpen(true)}
              className="group flex w-full items-center gap-1.5 rounded-full border border-dashed border-neutral-300/70 bg-white/50 py-1 pl-1 pr-2 text-left backdrop-blur-sm transition-colors hover:border-brand-primary/30 hover:bg-white/80">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-300 transition-colors group-hover:text-neutral-400">
                <MessageCircle
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1 font-sans text-sm text-neutral-400 transition-colors group-hover:text-neutral-500">
                로그인하고 댓글을 남겨 보세요
              </span>
              <span className="shrink-0 rounded-full border-2 border-brand-border bg-white px-3 py-1 font-sans text-xs font-semibold text-brand-primary shadow-[2px_2px_0_var(--color-brand-shadow-soft)] transition-[transform,box-shadow,background-color] group-hover:-translate-x-px group-hover:-translate-y-px group-hover:bg-brand-primary-soft group-hover:shadow-[3px_3px_0_var(--color-brand-shadow-soft)]">
                로그인
              </span>
            </button>
          )}
          {commentsLoading ? (
            <p className="mt-3 text-center font-sans text-xs text-neutral-400">
              불러오는 중…
            </p>
          ) : comments.length === 0 ? (
            <p className="mt-3 text-center font-sans text-xs text-neutral-400">
              아직 댓글이 없어요
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100/90">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="flex gap-2.5 py-3 first:pt-0 last:pb-0">
                  <CommentAvatar nickname={comment.author.nickname} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 font-sans text-xs leading-5">
                        <FeedAuthorNickname
                          userId={comment.author.id}
                          nickname={comment.author.nickname}
                          className="text-neutral-800"
                        />

                        <span className="text-neutral-300"> · </span>
                        <time
                          dateTime={comment.createdAt}
                          className="font-medium text-neutral-400">
                          {formatCommentDate(comment.createdAt)}
                        </time>
                        {comment.updatedAt !== comment.createdAt ? (
                          <span className="ml-1.5 inline rounded-full bg-brand-primary-soft px-1.5 py-px text-[10px] font-medium text-brand-primary">
                            수정됨
                          </span>
                        ) : null}
                      </p>

                      {user &&
                      comment.authorId === user.id &&
                      editingCommentId !== comment.id ? (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => startCommentEdit(comment)}
                            aria-label="댓글 수정"
                            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-brand-primary">
                            <PencilIcon className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommentDelete(comment.id)}
                            aria-label="댓글 삭제"
                            disabled={deletingPendingId === comment.id}
                            className="rounded-full p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      ) : user?.role === 'admin' &&
                        comment.authorId !== user.id ? (
                        <button
                          type="button"
                          onClick={() => handleCommentDelete(comment.id)}
                          aria-label="댓글 삭제"
                          disabled={deletingPendingId === comment.id}
                          className="shrink-0 rounded-full p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      ) : null}
                    </div>

                    {editingCommentId === comment.id ? (
                      <form
                        className="mt-2 flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/80 py-1 pl-3 pr-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void handleCommentUpdate(comment.id);
                        }}>
                        <input
                          type="text"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="min-w-0 flex-1 bg-transparent py-1.5 font-sans text-sm text-neutral-800 focus:outline-none"
                          disabled={editingPendingId === comment.id}
                        />
                        <button
                          type="submit"
                          disabled={
                            !editDraft.trim() || editingPendingId === comment.id
                          }
                          className={`${brandPillBtn} shrink-0 !px-2.5 !py-1 !text-[11px] disabled:opacity-40`}>
                          {editingPendingId === comment.id
                            ? '수정 중…'
                            : '저장'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelCommentEdit}
                          disabled={editingPendingId === comment.id}
                          className="shrink-0 px-2 font-sans text-[11px] text-neutral-400 hover:text-neutral-600">
                          취소
                        </button>
                      </form>
                    ) : (
                      <p className="mt-1 break-words font-sans text-[0.9375rem] leading-relaxed text-neutral-700">
                        {comment.body}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
