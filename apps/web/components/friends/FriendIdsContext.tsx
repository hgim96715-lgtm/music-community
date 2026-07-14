'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriends } from '@/lib/api';
import { otherUser } from '@/lib/friendsUtils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type FriendIdsContextValue = {
  ids: ReadonlySet<string>;
  /** 시트에서 친구 맺기/끊기 후 칩 갱신 */
  reload: () => void;
};

const FriendIdsContext = createContext<FriendIdsContextValue>({
  ids: new Set(),
  reload: () => {},
});

/** 피드에서 친구 칩용 — 로그인 시 accepted 친구 id Set */
export function FriendIdsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  const reload = useCallback(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    void (async () => {
      try {
        const friends = await fetchFriends();
        setIds(new Set(friends.map((f) => otherUser(f, user.id).id)));
      } catch {
        setIds(new Set());
      }
    })();
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setIds(new Set());
      return;
    }
    reload();
  }, [isLoading, user, reload]);

  return (
    <FriendIdsContext.Provider value={{ ids, reload }}>
      {children}
    </FriendIdsContext.Provider>
  );
}

export function useIsFriend(userId: string): boolean {
  const { user } = useAuth();
  const { ids } = useContext(FriendIdsContext);
  return useMemo(() => {
    if (!user || user.id === userId) return false;
    return ids.has(userId);
  }, [user, userId, ids]);
}

export function useReloadFriendIds(): () => void {
  return useContext(FriendIdsContext).reload;
}
