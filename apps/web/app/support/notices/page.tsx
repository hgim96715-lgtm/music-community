import { fetchPublishedNotices } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import Link from 'next/link';

function noticeSummary(body: string, max = 80) {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

/** 공지사항 목록 (사용자 열람) — GET /support/notices */
export default async function SupportNoticesPage() {
  let notices: Awaited<ReturnType<typeof fetchPublishedNotices>> = [];
  let loadError = '';

  try {
    notices = await fetchPublishedNotices();
  } catch {
    loadError = '공지사항을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
  }

  return (
    <main className={authPageClassName}>
      <Link
        href="/support"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        고객지원
      </Link>
      <div className="mb-6">
        <h1 className={`${authTitleClassName} flex items-center gap-2`}>
          <Megaphone
            className="size-6 shrink-0 text-brand-primary"
            aria-hidden
          />
          공지사항
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          공지사항을 확인할 수 있어요.
        </p>
      </div>

      <section>
        {loadError ? (
          <p className="text-sm text-red-500" role="alert">
            {loadError}
          </p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 공지사항이 없어요.</p>
        ) : (
          <ul className="border-t-2 border-[rgb(201_166_107/0.45)]">
            {notices.map((n) => (
              <li
                key={n.id}
                className="border-b-2 border-[rgb(201_166_107/0.45)]">
                <Link
                  href={`/support/notices/${n.id}`}
                  className="flex items-start gap-3 py-4 opacity-95 transition-opacity hover:opacity-100">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-brand-primary-soft text-brand-primary">
                    <Megaphone className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-primary">
                      {n.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {noticeSummary(n.body)}
                    </p>
                    {n.publishedAt ? (
                      <p className="mt-1.5 text-[11px] text-neutral-500">
                        {formatDisplayDate(n.publishedAt)}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    className="mt-1 size-4 shrink-0 text-neutral-500"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
