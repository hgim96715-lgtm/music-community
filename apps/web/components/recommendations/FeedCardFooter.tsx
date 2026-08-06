'use client';

import { Flag, MessageCircle, PencilIcon, Share2, Trash2 } from 'lucide-react';
import { ACTION_BTN, ACTION_ICON, COUNT_SLOT } from '@/lib/feedCardActions';
import { HeartButton } from './HeartButton';
import { MoodNapkin } from './MoodNapkin';
import { FeedCardSaveButton } from '@/components/saved-cards/FeedCardSaveButton';
import { LoginPromptDialog } from '../auth/LoginPromptDialog';
import { useAuth } from '../auth/AuthProvider';
import { Fragment, useEffect, useRef, useState } from 'react';
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
import { createCommentReport } from '@/lib/reports';
import { ReportDialog } from '../reports/ReportDialog';
import { ActionCount } from './ActionCount';
import {
  REPLY_INDENT_CAP,
  REPLY_PREVIEW_COUNT,
  commentDepth,
  commentRootId,
  flattenCommentThread,
  threadSlice,
  visibleCommentIds,
} from '@/lib/commentThread';

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
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [reportLoginOpen, setReportLoginOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [expandedRootIds, setExpandedRootIds] = useState<Set<string>>(
    () => new Set(),
  );
  const replyInputRef = useRef<HTMLInputElement>(null);
  const replyComposerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    setDisplayedCommentCount(commentCount);
  }, [commentCount]);

  useEffect(() => {
    if (!replyToId) return;
    replyComposerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
    replyInputRef.current?.focus();
  }, [replyToId]);

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
      setExpandedRootIds(new Set());
      return;
    }
    setCommentsOpen(true);
    setCommentsLoading(true);
    try {
      const data = await fetchComments(recommendationId);
      setComments(flattenCommentThread(data));
      setDisplayedCommentCount(data.length);
      setExpandedRootIds(new Set());
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
      const created = await createComment(
        recommendationId,
        body,
        replyToId ?? undefined,
      );
      const nextList = flattenCommentThread([...comments, created]);
      setComments(nextList);
      setDisplayedCommentCount((count) => count + 1);
      setCommentDraft('');
      // 새 답글이 접힌 구간에 가려질 때만 그 루트 펼침
      if (created.parentId) {
        const rootId = commentRootId(nextList, created.id);
        const visibleWithoutExpand = visibleCommentIds(
          nextList,
          expandedRootIds,
        );
        if (!visibleWithoutExpand.has(created.id)) {
          setExpandedRootIds((prev) => {
            const next = new Set(prev);
            next.add(rootId);
            return next;
          });
        }
      }
      setReplyToId(null);
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
      if (replyToId === commentId) setReplyToId(null);
    } catch {
      showHint('댓글을 삭제하지 못했어요');
    } finally {
      setDeletingPendingId(null);
    }
  }

  function openCommentReport(commentId: string) {
    if (!user) {
      window.setTimeout(() => setReportLoginOpen(true), 0);
      return;
    }
    window.setTimeout(() => setReportCommentId(commentId), 0);
  }

  async function handleCommentReport(reason: string) {
    if (!reportCommentId || isReporting) return;
    setIsReporting(true);
    try {
      await createCommentReport(reportCommentId, reason);
      setReportCommentId(null);
      showHint('신고를 접수했어요');
    } catch (error) {
      throw error instanceof Error ? error : new Error('신고에 실패했습니다.');
    } finally {
      setIsReporting(false);
    }
  }

  const visibleIds = visibleCommentIds(comments, expandedRootIds);
  const visibleComments = comments.filter((c) => visibleIds.has(c.id));
  const replyTarget = replyToId
    ? comments.find((c) => c.id === replyToId)
    : undefined;

  function renderCommentComposer() {
    return (
      <div className="w-full min-w-0">
        {replyTarget ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-full border border-[rgb(201_166_107/0.22)] bg-[rgb(201_166_107/0.08)] px-3 py-1.5">
            <p className="min-w-0 truncate font-sans text-xs text-[#a89880]">
              @{replyTarget.author.nickname}에게 답글 중
            </p>
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="shrink-0 font-sans text-xs font-medium text-brand-primary hover:text-brand-primary/80">
              취소
            </button>
          </div>
        ) : null}
        <form
          onSubmit={handleCommentSubmit}
          className="flex items-center gap-1.5 rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.85)] py-1 pl-1 pr-1.5 shadow-[0_4px_16px_rgb(0_0_0/0.28)] backdrop-blur-sm">
          <CommentEmojiPicker
            onPick={(emoji) => setCommentDraft((prev) => prev + emoji)}
          />
          <input
            ref={replyInputRef}
            type="text"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder={
              replyToId ? '답글을 입력해 주세요' : '댓글을 입력해 주세요'
            }
            className="min-w-0 flex-1 bg-transparent px-1 py-2 font-sans text-sm text-[#ebe4da] placeholder:text-[#a89880] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentDraft.trim()}
            className={`${brandPillBtn} shrink-0 !px-3.5 !py-1.5 !text-xs disabled:opacity-40`}>
            등록
          </button>
        </form>
      </div>
    );
  }

  return (
    <footer className="mt-2">
      <MoodNapkin moods={moods} />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[rgb(201_166_107/0.12)] pt-3">
        <div className="flex items-center">
          <HeartButton
            recommendationId={recommendationId}
            likedByMe={likedByMe}
            likeCount={likeCount}
            authorId={authorId}
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
          className="mt-4 border-t border-[rgb(201_166_107/0.14)] pt-4">
          {user ? (
            replyToId ? null : (
              renderCommentComposer()
            )
          ) : (
            <button
              type="button"
              onClick={() => setLoginDialogOpen(true)}
              className="group flex w-full items-center gap-1.5 rounded-full border border-dashed border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.55)] py-1 pl-1 pr-2 text-left backdrop-blur-sm transition-colors hover:border-brand-primary/40 hover:bg-[rgb(28_24_20/0.8)]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#a89880] transition-colors group-hover:text-[#ebe4da]">
                <MessageCircle
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1 font-sans text-sm text-[#a89880] transition-colors group-hover:text-[#ebe4da]">
                로그인하고 댓글을 남겨 보세요
              </span>
              <span className="shrink-0 rounded-full border border-brand-border/60 bg-brand-primary px-3 py-1 font-sans text-xs font-semibold text-[color:var(--color-lp-ink)] shadow-[0_2px_8px_rgb(0_0_0/0.25)] transition-colors group-hover:bg-brand-primary/90">
                로그인
              </span>
            </button>
          )}
          {commentsLoading ? (
            <p className="mt-3 text-center font-sans text-xs text-[#a89880]">
              불러오는 중…
            </p>
          ) : comments.length === 0 ? (
            <p className="mt-3 text-center font-sans text-xs text-[#a89880]">
              아직 댓글이 없어요
            </p>
          ) : (
            <ul className="mt-4">
              {visibleComments.map((comment, index) => {
                const depth = commentDepth(comments, comment.id);
                const indent = Math.min(depth, REPLY_INDENT_CAP);
                const parent = comment.parentId
                  ? comments.find((c) => c.id === comment.parentId)
                  : undefined;
                const startsRootThread = depth === 0 && index > 0;
                const rootId = commentRootId(comments, comment.id);
                const thread = threadSlice(comments, rootId);
                const hiddenReplyCount =
                  !expandedRootIds.has(rootId) &&
                  thread.length - 1 > REPLY_PREVIEW_COUNT
                    ? thread.length - 1 - REPLY_PREVIEW_COUNT
                    : 0;
                const lastVisibleInThread = [...thread]
                  .reverse()
                  .find((t) => visibleIds.has(t.id));
                const showMoreReplies =
                  hiddenReplyCount > 0 &&
                  lastVisibleInThread?.id === comment.id;

                return (
                  <Fragment key={comment.id}>
                    <li
                      style={
                        indent > 0 ? { paddingLeft: indent * 28 } : undefined
                      }
                      className={`flex gap-2.5 ${
                        startsRootThread
                          ? 'mt-3 border-t border-[rgb(201_166_107/0.12)] pt-3'
                          : depth === 0
                            ? 'py-2.5 first:pt-0'
                            : 'py-1.5'
                      }`}>
                      <CommentAvatar nickname={comment.author.nickname} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-sans text-xs leading-5">
                            <FeedAuthorNickname
                              userId={comment.author.id}
                              nickname={comment.author.nickname}
                              className="font-medium text-[#ebe4da]"
                            />

                            <span className="text-[#a89880]/70"> · </span>
                            <time
                              dateTime={comment.createdAt}
                              className="font-medium text-[#a89880]">
                              {formatCommentDate(comment.createdAt)}
                            </time>
                            {comment.updatedAt !== comment.createdAt ? (
                              <span className="ml-1.5 inline rounded-full bg-[rgb(201_166_107/0.16)] px-1.5 py-px text-[10px] font-medium text-brand-primary">
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
                                className="rounded-full p-1 text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-brand-primary">
                                <PencilIcon className="size-3.5" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCommentDelete(comment.id)}
                                aria-label="댓글 삭제"
                                disabled={deletingPendingId === comment.id}
                                className="rounded-full p-1 text-[#a89880] transition-colors hover:bg-red-400/10 hover:text-red-300">
                                <Trash2 className="size-3.5" aria-hidden />
                              </button>
                            </div>
                          ) : comment.authorId !== user?.id ? (
                            <div className="flex shrink-0 items-center gap-0.5">
                              {user?.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCommentDelete(comment.id)
                                  }
                                  aria-label="댓글 삭제"
                                  disabled={deletingPendingId === comment.id}
                                  className="rounded-full p-1 text-[#a89880] transition-colors hover:bg-red-400/10 hover:text-red-300">
                                  <Trash2 className="size-3.5" aria-hidden />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => openCommentReport(comment.id)}
                                aria-label="댓글 신고"
                                className="rounded-full p-1 text-[#a89880] transition-colors hover:bg-amber-400/10 hover:text-amber-300">
                                <Flag className="size-3.5" aria-hidden />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {parent ? (
                          <p className="mt-0.5 font-sans text-[11px] text-[#a89880]/85">
                            ↳ @{parent.author.nickname}
                          </p>
                        ) : null}

                        {editingCommentId === comment.id ? (
                          <form
                            className="mt-2 flex items-center gap-1.5 rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(28_24_20/0.85)] py-1 pl-3 pr-1.5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void handleCommentUpdate(comment.id);
                            }}>
                            <input
                              type="text"
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="min-w-0 flex-1 bg-transparent py-1.5 font-sans text-sm text-[#ebe4da] focus:outline-none"
                              disabled={editingPendingId === comment.id}
                            />
                            <button
                              type="submit"
                              disabled={
                                !editDraft.trim() ||
                                editingPendingId === comment.id
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
                              className="shrink-0 px-2 font-sans text-[11px] text-[#a89880] hover:text-[#ebe4da]">
                              취소
                            </button>
                          </form>
                        ) : (
                          <>
                            <p className="mt-0.5 break-words font-sans text-[0.9375rem] leading-relaxed text-[#d4c8b8]">
                              {comment.body}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (!user) {
                                  setLoginDialogOpen(true);
                                  return;
                                }
                                setReplyToId(comment.id);
                                setEditingCommentId(null);
                                setExpandedRootIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(
                                    commentRootId(comments, comment.id),
                                  );
                                  return next;
                                });
                              }}
                              className="mt-0.5 font-sans text-[11px] font-medium text-[#a89880] hover:text-brand-primary">
                              답글
                            </button>
                          </>
                        )}
                      </div>
                    </li>

                    {replyToId === comment.id && user ? (
                      <li
                        ref={replyComposerRef}
                        className="py-2"
                        style={{
                          paddingLeft: Math.min(depth + 1, REPLY_INDENT_CAP) * 28,
                        }}>
                        {renderCommentComposer()}
                      </li>
                    ) : null}

                    {showMoreReplies ? (
                      <li className="py-1" style={{ paddingLeft: 28 }}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRootIds((prev) => {
                              const next = new Set(prev);
                              next.add(rootId);
                              return next;
                            })
                          }
                          className="font-sans text-[11px] font-medium text-brand-primary hover:text-brand-primary/80">
                          답글 {hiddenReplyCount}개 더 보기
                        </button>
                      </li>
                    ) : null}
                  </Fragment>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <ReportDialog
        open={reportCommentId !== null}
        title="이 댓글을 신고할까요?"
        isPending={isReporting}
        onClose={() => {
          if (!isReporting) setReportCommentId(null);
        }}
        onSubmit={handleCommentReport}
      />
      <LoginPromptDialog
        open={reportLoginOpen}
        onClose={() => setReportLoginOpen(false)}
        redirectPath="/recommendations"
        title="로그인이 필요해요"
        description="신고하려면 로그인해 주세요."
      />
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
