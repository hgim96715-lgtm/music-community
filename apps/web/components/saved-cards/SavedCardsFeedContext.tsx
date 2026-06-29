/** SavedCardsFeedProvider — 피드에서 저장 버튼 누르면 저장됨 표시 ,
 * 이미 포토카드가 저장되어 있으면 저장됨 표시 > 커스텀 모달이 열리면 안됨
 */
'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchSavedCards } from '@/lib/api';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type SavedCardsFeedContextValue = {
  isSaved: (recommendationId: string) => boolean;
  markSaved: (recommendationId: string) => void;
};

const SavedCardsFeedContext = createContext<SavedCardsFeedContextValue | null>(
  null,
);
export function SavedCardsFeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    let cancelled = false;
    fetchSavedCards()
      .then((cards) => {
        if (!cancelled) {
          setSavedIds(new Set(cards.map((card) => card.recommendationId)));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedIds(new Set());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const markSaved = useCallback((recommendationId: string) => {
    setSavedIds((prev) => new Set(prev).add(recommendationId));
  }, []);

  const isSaved = useCallback(
    (recommendationId: string) => savedIds.has(recommendationId),
    [savedIds],
  );
  const value = useMemo(() => ({ isSaved, markSaved }), [isSaved, markSaved]);
  return (
    <SavedCardsFeedContext.Provider value={value}>
      {children}
    </SavedCardsFeedContext.Provider>
  );
}

const noop = () => {};

export function useSavedCardsFeed() {
  const ctx = useContext(SavedCardsFeedContext);
  if (!ctx) {
    return {
      isSaved: () => false,
      markSaved: noop,
    };
  }
  return ctx;
}
