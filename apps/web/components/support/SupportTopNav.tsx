import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type SupportTopNavProps = {
  backHref: string;
  backLabel: string;
};

/** 고객지원·약관 상단 — 왼쪽 뒤로 · 오른쪽 설정 */
export function SupportTopNav({ backHref, backLabel }: SupportTopNavProps) {
  const linkClassName =
    'inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary-soft active:opacity-80';

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <Link href={backHref} className={linkClassName}>
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
      <Link href="/users/me/settings" className={linkClassName}>
        설정
      </Link>
    </div>
  );
}
