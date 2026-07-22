import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

/** 개인정보 처리방침 (정적 · 비로그인 공개) */
export default function PrivacyPage() {
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
        <h1 className={authTitleClassName}>개인정보 처리방침</h1>
        <p className="mt-1 text-xs text-neutral-500">시행일 2026-07-21</p>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-neutral-600">
          <section>
            <h2 className="font-semibold text-brand-primary">
              1. 수집하는 개인정보
            </h2>
            <p className="mt-1.5">
              서비스는 회원가입·로그인·프로필 이용을 위해 이메일, 닉네임, (선택)
              프로필 이미지·소개 등을 수집할 수 있습니다. 소셜 로그인 시
              제공자가 전달하는 계정 정보가 포함될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">2. 이용 목적</h2>
            <p className="mt-1.5">
              수집한 정보는 회원 식별, 서비스 제공·개선, 고객지원, 부정 이용
              방지 목적으로 사용합니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">
              3. 보관 및 파기
            </h2>
            <p className="mt-1.5">
              개인정보는 이용 목적 달성 또는 회원 탈퇴 시 관련 법령에 따라
              보관·파기합니다. 탈퇴 절차 세부 정책은 추후 확정됩니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">4. 제3자 제공</h2>
            <p className="mt-1.5">
              법령에 근거하거나 이용자 동의가 있는 경우를 제외하고 개인정보를
              외부에 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-brand-primary">5. 문의</h2>
            <p className="mt-1.5">
              개인정보 관련 문의는 고객지원 메뉴를 통해 접수할 수 있습니다.
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
