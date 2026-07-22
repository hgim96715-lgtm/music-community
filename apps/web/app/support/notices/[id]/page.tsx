import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const notices = [
  {
    id: 'notice-1',
    title: '서비스 안내',
    updatedAt: '2026-07-21',
    body: `공지사항은 admin이 관리합니다.

이 페이지는 사용자 열람용으로, 목록에서 선택한 공지의 본문을 보여줍니다.`,
  },
] as const;

type NoticeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** 공지사항 상세 (사용자 열람) */
export default async function SupportNoticeDetailPage({
  params,
}: NoticeDetailPageProps) {
  const { id } = await params;
  const notice = notices.find((n) => n.id === id);
  if (!notice) notFound();

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
              <p className="mt-1 text-xs text-neutral-500">{notice.updatedAt}</p>
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
