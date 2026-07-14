'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { FriendRequestPromptDialog } from '@/components/friends/FriendRequestPromptDialog';
import { fetchFriendRequests } from '@/lib/api';
import {
  getUnseenFriendRequestIds,
  markFriendRequestIdsSeen,
} from '@/lib/friendRequestPrompt';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const SKIP_PREFIXES = ['/login', '/register', '/auth'];

function shouldSkipPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}

export function FriendRequestPromptHost() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [firstNickname, setFirstNickname] = useState('');
  const [unseenIds, setUnseenIds] = useState<string[]>([]);

  const dismiss = useCallback(() => {
    markFriendRequestIdsSeen(unseenIds);
    setOpen(false);
    setUnseenIds([]);
  }, [unseenIds]);

  useEffect(() => {
    if (isLoading || !user || shouldSkipPath(pathname)) return;
    let cancelled = false;
    async function check() {
      try {
        const { received } = await fetchFriendRequests();
        if (cancelled) return;
        if (received.length === 0) return;

        const unseen = getUnseenFriendRequestIds(received.map((r) => r.id));
        if (unseen.length === 0) return;

        const first = received.find((r) => unseen.includes(r.id));
        if (!first) return;

        setUnseenIds(unseen);
        setFirstNickname(first.requester.nickname);
        setOpen(true);
      } catch {}
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, pathname]);
  return (
    <FriendRequestPromptDialog
      open={open}
      onClose={dismiss}
      firstNickname={firstNickname}
      count={unseenIds.length}
    />
  );
}
