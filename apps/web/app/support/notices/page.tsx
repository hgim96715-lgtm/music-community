import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronRight, Megaphone } from 'lucide-react';
import Link from 'next/link';

/** 공지사항 목록 (사용자 열람) — 본문은 /support/notices/[id] */
export default function SupportNoticesPage() {
  const notices = [
    {
      id: 'notice-1',
      title: '서비스 안내',
      updatedAt: '2026-07-21',
      summary:
        '공지사항은 admin이 관리합니다. 이 페이지는 사용자 열람용입니다.',
    },
  ];

  return (
    <main className={authPageClassName}>
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
        {notices.length === 0 ? (
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
                      {n.summary}
                    </p>
                    <p className="mt-1.5 text-[11px] text-neutral-500">
                      {n.updatedAt}
                    </p>
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

      <p className="mt-8 text-xs text-neutral-500">
        공지 작성/수정/게시/숨김은 admin 권한에서 처리됩니다.
      </p>
    </main>
  );
}
