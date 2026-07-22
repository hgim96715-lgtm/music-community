import {
  authPageClassName,
  appNavLinkClassName,
  authTitleClassName,
} from '@/lib/form';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/** 고객지원 허브 (비로그인 OK) */
export default function SupportPage() {
  const itemClassName =
    'w-full flex items-center justify-between rounded-xl border border-dashed border-[rgb(31_26_22/0.12)] px-3.5 py-3 text-sm text-[#a89880]';
  return (
    <main className={authPageClassName}>
      <div className="mb-6">
        <h1 className={authTitleClassName}>고객지원</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          공지사항과 자주 묻는 질문, 문의를 한 곳에서 확인할 수 있어요.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/support/notices" className={itemClassName}>
          공지사항
          <ChevronRight className="size-4 text-neutral-500" aria-hidden />
        </Link>
        <Link href="/support/faq" className={itemClassName}>
          자주 묻는 질문
          <ChevronRight className="size-4 text-neutral-500" aria-hidden />
        </Link>
        <Link href="/support/contact" className={itemClassName}>
          문의하기
          <ChevronRight className="size-4 text-neutral-500" aria-hidden />
        </Link>
      </div>
      <div className="mt-8 border-t border-[rgb(31_26_22/0.12)] pt-4">
        <p className="text-sm font-semibold text-neutral-800">법적 문서</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/legal/terms" className={appNavLinkClassName}>
            이용약관
          </Link>
          <Link href="/legal/privacy" className={appNavLinkClassName}>
            개인정보 처리방침
          </Link>
        </div>
      </div>
      <p className="mt-auto pt-6 text-xs text-neutral-500">
        안내는 준비 중인 항목이 있을 수 있어요.
      </p>
    </main>
  );
}
