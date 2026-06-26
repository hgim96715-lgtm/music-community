'use client';

import { clearAuthStorage, fetchMe } from '@/lib/api';
import type { ApiAuthUser } from '@/lib/apiTypes';
import { getApiAccessToken } from '@/lib/authToken';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthContextValue = {
  user: ApiAuthUser | null;
  isLoading: boolean;
  setUser: (user: ApiAuthUser) => void;
  clearSession: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getApiAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await refreshUser();
      if (!cancelled) setIsLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      setUser,
      clearSession,
      refreshUser,
    }),
    [user, isLoading, setUser, clearSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }
  return ctx;
}
