import { authPageClassName, authTitleClassName } from '@/lib/form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

/** FAQ (1차 placeholder · 비로그인 공개) */
export default function SupportFaqPage() {
  const faqs = [
    {
      q: '추천 글은 하루에 몇 개까지 올릴 수 있나요?',
      a: '서비스 취지는 「하루 한곡」입니다. 자세한 제한은 추후 공지에서 안내합니다.',
    },
    {
      q: '회원 탈퇴는 어디서 하나요?',
      a: '마이 홈 → 설정 → 회원탈퇴에서 예약할 수 있어요. 예약 후 7일간 유예되며, 그사이 같은 설정에서 「탈퇴 취소」로 되돌릴 수 있습니다. 유예가 끝나면 계정이 정리되고, 피드에 남긴 글·댓글은 「탈퇴한 사용자」로 남을 수 있어요.',
    },
    {
      q: '문의는 어떻게 하나요?',
      a: '고객지원의 「문의하기」 메뉴를 이용해 주세요.',
    },
  ];

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
        <h1 className={authTitleClassName}>자주 묻는 질문</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          자주 묻는 질문을 모아 두었어요.
        </p>

        <ul className="mt-6 flex flex-col gap-5">
          {faqs.map((item) => (
            <li key={item.q}>
              <h2 className="text-sm font-semibold text-brand-primary">
                {item.q}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                {item.a}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-xs text-neutral-500">
          내용은 1차 초안이며, 이후 공지·운영 정책에 맞게 업데이트됩니다.
        </p>
      </article>
    </main>
  );
}
