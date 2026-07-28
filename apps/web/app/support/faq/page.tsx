import { SupportTopNav } from '@/components/support/SupportTopNav';
import { authPageClassName, authTitleClassName } from '@/lib/form';

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
      q: '채팅 메시지를 「전체에서 삭제」하면 언제든 지울 수 있나요?',
      a: '내가 보낸 메시지는 보낸 뒤 5분 안에만 「전체에서 삭제」할 수 있어요. 5분이 지나면 내 화면에서만 지우는 「나에게서만 삭제」만 가능합니다. 방장은 방 정리를 위해 시간 제한 없이 전체에서 삭제할 수 있어요.',
    },
    {
      q: '문의는 어떻게 하나요?',
      a: '고객지원의 「문의하기」 메뉴를 이용해 주세요.',
    },
  ];

  return (
    <main className={authPageClassName}>
      <SupportTopNav backHref="/support" backLabel="고객지원" />

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
