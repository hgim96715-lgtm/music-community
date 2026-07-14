'use client';

import { feedNicknameLinkClassName } from '@/lib/form';
import { useIsFriend } from '@/components/friends/FriendIdsContext';
import Link from 'next/link';

type FeedAuthorNicknameProps = {
  userId: string;
  nickname: string;
  /** 헤더 mood 글자색 등 */
  className?: string;
  showFriendChip?: boolean;
};

/** 피드·댓글 `@닉` — soft pill hover · 친구면 ♪ 스티커 */
export function FeedAuthorNickname({
  userId,
  nickname,
  className = '',
  showFriendChip = true,
}: FeedAuthorNicknameProps) {
  const isFriend = useIsFriend(userId);

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      <Link
        href={`/users/${userId}`}
        className={`${feedNicknameLinkClassName} ${className}`}>
        @{nickname}
      </Link>
      {showFriendChip && isFriend ? (
        <span
          className="inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border border-[#353535]/10 bg-brand-primary-soft text-[0.65rem] leading-none text-brand-primary shadow-[1.5px_1.5px_0_var(--color-brand-shadow-soft)]"
          title="친구"
          aria-label="친구">
          <span aria-hidden>♪</span>
        </span>
      ) : null}
    </span>
  );
}
