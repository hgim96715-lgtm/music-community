import { authTitleClassName } from '@/lib/form';
import { napkinHandClassName } from '@/lib/napkinFont';
import { PostButton } from './PostButton';

export function FeedHeader() {
  return (
    <header className="mb-8">
      <p className="mb-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-brand-primary/70">
        LP Community
      </p>
      <div className="flex items-center justify-between gap-3">
        <h1 className={`${authTitleClassName} text-xl tracking-tight`}>
          오늘의 한 곡
        </h1>
        <PostButton />
      </div>
      <p
        className={`${napkinHandClassName} mt-2.5 max-w-[22rem] text-[1.2rem] leading-snug text-[#c9a66b]
        style={{ transform: 'rotate(-0.8deg)', transformOrigin: 'left center' }}`}>
        켜진 조명 아래, 누군가 고른 곡이 돌아갑니다.
      </p>
    </header>
  );
}
