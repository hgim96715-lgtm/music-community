'use client';

import {
  getLastLoginMethod,
  type LastLoginMethod,
} from '@/lib/lastLoginMethod';
import { useSyncExternalStore } from 'react';

type SocialProvider = 'google' | 'naver' | 'kakao' | 'apple';

type SocialLoginRowProps = {
  googleHref: string;
  naverHref: string;
};

const LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  naver: 'Naver',
  kakao: 'Kakao',
  apple: 'Apple',
};

const ORDER: SocialProvider[] = ['google', 'naver', 'kakao', 'apple'];

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function NaverMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={[
        'flex items-center justify-center font-black text-white',
        compact
          ? 'h-5 w-5 rounded text-[10px] bg-[#03C75A]'
          : 'h-7 w-7 rounded-lg text-sm bg-white/20',
      ].join(' ')}
      aria-hidden>
      N
    </span>
  );
}

function KakaoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={[
        'flex items-center justify-center',
        compact
          ? 'h-5 w-5 rounded bg-[#FEE500]'
          : 'h-7 w-7 rounded-lg bg-[#3C1E1E]/10',
      ].join(' ')}
      aria-hidden>
      <svg viewBox="0 0 24 24" className={compact ? 'h-3 w-3' : 'h-4 w-4'}>
        <path
          fill="#3C1E1E"
          d="M12 4C7.03 4 3 7.13 3 10.98c0 2.47 1.64 4.64 4.11 5.88l-.84 3.1c-.08.3.26.54.5.36l3.56-2.36c.54.08 1.1.12 1.67.12 4.97 0 9-3.13 9-6.98S16.97 4 12 4z"
        />
      </svg>
    </span>
  );
}

function AppleMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={[
        'flex items-center justify-center',
        compact
          ? 'h-5 w-5 rounded bg-neutral-900'
          : 'h-7 w-7 rounded-lg bg-white/15',
      ].join(' ')}
      aria-hidden>
      <svg viewBox="0 0 24 24" className={compact ? 'h-3 w-3' : 'h-4 w-4'}>
        <path
          fill="#fff"
          d="M16.37 12.64c-.03-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.8.75 3.01.73c1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.61-.03-.01-2.41-.93-2.44-3.67zM14.4 5.55c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.39-.59.69-1.11 1.79-.97 2.85 1.03.08 2.08-.52 2.71-1.32z"
        />
      </svg>
    </span>
  );
}

function ProviderIcon({
  provider,
  hero,
}: {
  provider: SocialProvider;
  hero?: boolean;
}) {
  switch (provider) {
    case 'google':
      return <GoogleMark size={hero ? 22 : 16} />;
    case 'naver':
      return <NaverMark compact={!hero} />;
    case 'kakao':
      return <KakaoMark compact={!hero} />;
    case 'apple':
      return <AppleMark compact={!hero} />;
  }
}

/** 최근 로그인 히어로 — 브랜드 색 채움 + 말풍선 */
const HERO_CLASS: Record<SocialProvider, string> = {
  google:
    'border-2 border-[#353535] bg-white text-neutral-900 hover:bg-neutral-50',
  naver: 'border-2 border-[#02A548] bg-[#03C75A] text-white hover:bg-[#02B350]',
  kakao:
    'border-2 border-[#E5CF00] bg-[#FEE500] text-[#3C1E1E] hover:bg-[#F5DC00]',
  apple:
    'border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800',
};

const HERO_LABEL: Record<SocialProvider, string> = {
  google: 'text-neutral-900',
  naver: 'text-white',
  kakao: 'text-[#3C1E1E]',
  apple: 'text-white',
};

/** 나머지 — 작고 조용한 아웃라인 */
const QUIET_CLASS: Record<
  SocialProvider,
  { enabled: string; disabled: string }
> = {
  google: {
    enabled:
      'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
    disabled: 'border border-neutral-200 bg-neutral-50 text-neutral-400',
  },
  naver: {
    enabled:
      'border border-[#03C75A]/30 bg-white text-[#027A3A] hover:bg-[#F3FBF6]',
    disabled: 'border border-neutral-200 bg-neutral-50 text-neutral-400',
  },
  kakao: {
    enabled: 'border border-[#FEE500]/70 bg-white text-[#3C1E1E]',
    disabled: 'border border-neutral-200 bg-neutral-50 text-neutral-400',
  },
  apple: {
    enabled: 'border border-neutral-300 bg-white text-neutral-700',
    disabled: 'border border-neutral-200 bg-neutral-50 text-neutral-400',
  },
};

function RecentLoginBubble() {
  return (
    <span className="pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
      <span className="relative inline-flex items-center gap-1 rounded-full border-[1.5px] border-[#353535] bg-white px-3 py-1 text-[12px] font-bold tracking-tight text-neutral-900 shadow-[2px_2px_0_#353535]">
        최근 로그인
        <span className="text-[13px] leading-none" aria-hidden>
          🔑
        </span>
        <span
          className="absolute -bottom-[6px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[#353535] bg-white"
          aria-hidden
        />
      </span>
    </span>
  );
}

function HeroChip({
  provider,
  href,
}: {
  provider: SocialProvider;
  href: string;
}) {
  return (
    <a
      href={href}
      title={`${LABELS[provider]} (최근 로그인)`}
      aria-label={`${LABELS[provider]} (최근 로그인)`}
      className={[
        'relative mt-3 flex w-full items-center justify-center gap-3 rounded-[1.25rem] px-5 py-4 text-base font-bold',
        'shadow-[3px_3px_0_#353535] transition-[transform,box-shadow,background-color] duration-150',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        HERO_CLASS[provider],
      ].join(' ')}>
      <RecentLoginBubble />
      <ProviderIcon provider={provider} hero />
      <span className={HERO_LABEL[provider]}>
        {LABELS[provider]}로 계속하기
      </span>
    </a>
  );
}

function QuietChip({
  provider,
  href,
  disabled,
  disabledHint,
}: {
  provider: SocialProvider;
  href?: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const styles = QUIET_CLASS[provider];
  const className = [
    'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-semibold',
    'shadow-[1px_1px_0_var(--color-brand-shadow-soft)] transition-[transform,box-shadow,background-color] duration-150',
    disabled ? styles.disabled : styles.enabled,
    disabled
      ? 'cursor-not-allowed opacity-60'
      : 'active:translate-x-px active:translate-y-px active:shadow-none',
  ].join(' ');

  const label = disabled
    ? `${LABELS[provider]} — ${disabledHint ?? '준비 중'}`
    : `${LABELS[provider]}로 계속하기`;

  const content = (
    <>
      <ProviderIcon provider={provider} />
      <span>{LABELS[provider]}</span>
    </>
  );

  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled
        title={label}
        aria-label={label}
        className={className}>
        {content}
      </button>
    );
  }

  return (
    <a href={href} title={label} aria-label={label} className={className}>
      {content}
    </a>
  );
}

export function SocialLoginRow({ googleHref, naverHref }: SocialLoginRowProps) {
  const lastMethod = useSyncExternalStore(
    subscribeToStorage,
    getLastLoginMethod,
    () => null as LastLoginMethod | null,
  );

  const hrefs: Partial<Record<SocialProvider, string>> = {
    google: googleHref,
    naver: naverHref,
  };

  const disabledHints: Partial<Record<SocialProvider, string>> = {
    kakao: '비즈 앱 전환 후 이용 가능',
    apple: 'Apple Developer 등록 후 이용 가능',
  };

  const heroProvider =
    lastMethod === 'google' || lastMethod === 'naver' ? lastMethod : null;

  const quietProviders = ORDER.filter((p) => p !== heroProvider);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        또는
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="flex flex-col gap-3 pt-3">
        {heroProvider ? (
          <HeroChip provider={heroProvider} href={hrefs[heroProvider]!} />
        ) : null}

        <div
          className={
            heroProvider ? 'grid grid-cols-3 gap-2' : 'flex flex-col gap-2.5'
          }>
          {quietProviders.map((provider) => {
            const disabled = provider === 'kakao' || provider === 'apple';
            const href = hrefs[provider];

            if (!heroProvider && href) {
              return (
                <a
                  key={provider}
                  href={href}
                  title={`${LABELS[provider]}로 계속하기`}
                  aria-label={`${LABELS[provider]}로 계속하기`}
                  className={[
                    'relative flex w-full items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold',
                    'shadow-[2px_2px_0_var(--color-brand-shadow-soft)] transition-[transform,box-shadow,background-color] duration-150',
                    'active:translate-x-px active:translate-y-px active:shadow-none',
                    QUIET_CLASS[provider].enabled,
                  ].join(' ')}>
                  <ProviderIcon provider={provider} hero />
                  <span>{LABELS[provider]}</span>
                </a>
              );
            }

            return (
              <QuietChip
                key={provider}
                provider={provider}
                href={href}
                disabled={disabled}
                disabledHint={disabledHints[provider]}
              />
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-neutral-500">
        Kakao·Apple은 나중에 연결됩니다. (비즈 앱 / Developer 유료)
      </p>
    </div>
  );
}
