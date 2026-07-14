'use client';

import { useAvatarAction } from '@/components/friends/AvatarActionContext';
import { useIsFriend } from '@/components/friends/FriendIdsContext';
import { feedNicknameLinkClassName } from '@/lib/form';

type FeedAuthorNicknameProps = {
  userId: string;
  nickname: string;
  className?: string;
  showFriendChip?: boolean;
};

/** 피드·댓글 @닉 — soft pill · 탭하면 AvatarActionSheet */
export function FeedAuthorNickname({
  userId,
  nickname,
  className = '',
  showFriendChip = true,
}: FeedAuthorNicknameProps) {
  const isFriend = useIsFriend(userId);
  const { openSheet } = useAvatarAction();

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      <button
        type="button"
        onClick={() => openSheet({ id: userId, nickname })}
        className={`${feedNicknameLinkClassName} ${className} text-left`}>
        @{nickname}
      </button>
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
