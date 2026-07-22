import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

/** 이용약관 (정적 · 비로그인 공개) */
export default function TermsPage() {
  return (
    <main className={authPageClassName}>
      <div className="mb-6">
        <Link
          href="/support"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          고객지원
        </Link>
      </div>

      <article>
        <h1 className={authTitleClassName}>이용약관</h1>
        <p className="mt-1 text-xs text-neutral-500">시행일 2026-07-21</p>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-neutral-600">
          <section>
            <h2 className="font-semibold text-brand-primary">제1조 (목적)</h2>
            <p className="mt-1.5">
              이 약관은 Music Community(이하 &quot;서비스&quot;)의 이용과
              관련하여 서비스와 이용자 간의 권리·의무 및 책임 사항을 규정합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">
              제2조 (서비스 내용)
            </h2>
            <p className="mt-1.5">
              서비스는 음악 추천, 저장, 채팅방 등 커뮤니티 기능을 제공합니다.
              세부 기능은 운영 상황에 따라 변경될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">
              제3조 (이용자의 의무)
            </h2>
            <p className="mt-1.5">
              이용자는 관련 법령과 서비스 운영 정책을 준수해야 하며, 타인의
              권리를 침해하거나 서비스를 방해하는 행위를 해서는 안 됩니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">제4조 (계정)</h2>
            <p className="mt-1.5">
              계정 정보는 이용자 본인이 관리합니다. 회원 탈퇴 및 계정 관련
              절차는 서비스 정책에 따릅니다.
            </p>
          </section>

          <p className="text-xs text-neutral-500">
            본문은 1차 초안입니다. 실제 서비스 운영 전 법률 검토 후 확정하세요.
          </p>
        </div>
      </article>
    </main>
  );
}
