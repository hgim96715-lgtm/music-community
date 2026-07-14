'use client';

import {
  AvatarActionSheetHost,
  type AvatarActionTarget,
} from '@/components/friends/AvatarActionSheetHost';
import { useReloadFriendIds } from '@/components/friends/FriendIdsContext';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type AvatarActionContextValue = {
  openSheet: (target: AvatarActionTarget) => void;
};

const AvatarActionContext = createContext<AvatarActionContextValue | null>(
  null,
);

/** FriendIdsProvider 안에 두기 */
export function AvatarActionProvider({ children }: { children: ReactNode }) {
  const reloadFriendIds = useReloadFriendIds();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AvatarActionTarget | null>(null);

  const openSheet = useCallback((next: AvatarActionTarget) => {
    setTarget(next);
    setOpen(true);
  }, []);

  return (
    <AvatarActionContext.Provider value={{ openSheet }}>
      {children}
      <AvatarActionSheetHost
        open={open}
        target={target}
        onClose={() => setOpen(false)}
        onChanged={() => reloadFriendIds()}
      />
    </AvatarActionContext.Provider>
  );
}

export function useAvatarAction(): AvatarActionContextValue {
  const ctx = useContext(AvatarActionContext);
  if (!ctx) {
    throw new Error('useAvatarAction은 AvatarActionProvider 안에서만 사용');
  }
  return ctx;
}
