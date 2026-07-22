import { fetchPublishedNotice } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type NoticeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** 공지사항 상세 (사용자 열람) — GET /support/notices/:id */
export default async function SupportNoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  const { id } = await params;

  let notice: Awaited<ReturnType<typeof fetchPublishedNotice>>;
  try {
    notice = await fetchPublishedNotice(id);
  } catch {
    notFound();
  }

  return (
    <main className={authPageClassName}>
      <div className="mb-6">
        <Link
          href="/support/notices"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          공지사항
        </Link>
      </div>

      <article>
        <header className="border-b-2 border-[rgb(201_166_107/0.45)] pb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-brand-primary-soft text-brand-primary">
              <Megaphone className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className={`${authTitleClassName} text-xl`}>{notice.title}</h1>
              {notice.publishedAt ? (
                <p className="mt-1 text-xs text-neutral-500">
                  {formatDisplayDate(notice.publishedAt)}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
          {notice.body}
        </p>
      </article>
    </main>
  );
}
