'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchPublishedNotices } from '@/lib/api';
import { markSupportNoticesSeen } from '@/lib/supportNoticeSeenStorage';
import { useEffect } from 'react';

type Props = {
  publishedAt?: string | null;
};

export function MarkSupportNoticesSeen({ publishedAt }: Props) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    if (publishedAt?.trim()) {
      markSupportNoticesSeen(user.id, publishedAt);
      return;
    }
    let cancelled = false;
    fetchPublishedNotices()
      .then((notices) => {
        if (cancelled) return;
        let latest = '';
        let latestMs = 0;
        for (const notice of notices) {
          const at = notice.publishedAt?.trim();
          if (!at) continue;
          const ms = new Date(at).getTime();
          if (ms > latestMs) {
            latestMs = ms;
            latest = at;
          }
        }
        if (latest) markSupportNoticesSeen(user.id, latest);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, publishedAt]);
  return null;
}
