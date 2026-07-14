'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriends } from '@/lib/api';
import { otherUser } from '@/lib/friendsUtils';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const FriendIdsContext = createContext<ReadonlySet<string>>(new Set());

/** 피드에서 친구 칩용 — 로그인 시 accepted 친구 id Set */
export function FriendIdsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const friends = await fetchFriends();
        if (cancelled) return;
        setIds(
          new Set(friends.map((f) => otherUser(f, user.id).id)),
        );
      } catch {
        if (!cancelled) setIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  return (
    <FriendIdsContext.Provider value={ids}>{children}</FriendIdsContext.Provider>
  );
}

export function useIsFriend(userId: string): boolean {
  const { user } = useAuth();
  const ids = useContext(FriendIdsContext);
  return useMemo(() => {
    if (!user || user.id === userId) return false;
    return ids.has(userId);
  }, [user, userId, ids]);
}
