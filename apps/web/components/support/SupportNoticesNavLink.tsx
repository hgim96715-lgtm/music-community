'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchPublishedNotices } from '@/lib/api';
import { hasUnseenSupportNotice } from '@/lib/supportNoticeSeenStorage';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  className: string;
};

export function SupportNoticesNavLink({ className }: Props) {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setShowNew(false);
      return;
    }
    let cancelled = false;
    fetchPublishedNotices()
      .then((notices) => {
        if (!cancelled) {
          setShowNew(hasUnseenSupportNotice(user.id, notices));
        }
      })
      .catch(() => {
        if (!cancelled) setShowNew(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <Link href="/support/notices" className={className}>
      <span className="flex min-w-0 items-center gap-2">
        공지사항
        {showNew ? (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-primary bg-brand-primary-soft">
            NEW
          </span>
        ) : null}
      </span>
      <ChevronRight className="size-4 text-neutral-500" aria-hidden />
    </Link>
  );
}
