/** 인증·작성 폼 — LP 톤 (흰 pill ❌ · brass border · 잉크 패널) */

export const authPageClassName =
  'mx-auto flex min-h-screen max-w-lg flex-col bg-brand-bg px-5 py-10';

export const authTitleClassName =
  'text-2xl font-semibold text-brand-primary';

export const pillInputClassName =
  'w-full rounded-full border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.9)] py-2.5 text-sm text-[#ebe4da] outline-none transition-[border-color,box-shadow] placeholder:text-[#a89880]/65 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25';

export const pillTextareaClassName =
  'w-full resize-none rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.9)] px-4 py-3 text-sm text-[#ebe4da] outline-none transition-[border-color,box-shadow] placeholder:text-[#a89880]/65 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/25';

export const formLegendClassName = 'text-sm font-medium text-brand-primary';

export const appHeaderClassName =
  'app-header border-b border-[rgb(201_166_107/0.18)] bg-[rgb(20_17_14/0.88)] backdrop-blur-[10px]';

export const appHeaderInnerClassName =
  'mx-auto flex max-w-lg items-center justify-between px-5 py-3.5';

export const appLogoClassName =
  'inline-block rounded-full border border-[rgb(201_166_107/0.22)] bg-brand-primary-soft px-2.5 py-1 text-sm font-semibold tracking-tight text-brand-primary shadow-[1px_1px_0_var(--color-brand-shadow-soft)] transition-[transform,box-shadow] duration-150 active:translate-x-px active:translate-y-px active:shadow-none';

export const appNavLinkClassName =
  'rounded-full px-2.5 py-1 text-sm font-medium text-[color:var(--color-lp-muted)] transition-colors hover:bg-brand-primary-soft hover:text-brand-primary';

export const authSubmitClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-[color:var(--color-lp-ink)] transition-colors hover:bg-brand-primary/90 disabled:opacity-50';

/** 보조 링크 — 밑줄 X · hover 시 soft pill */
export const authLinkClassName =
  'inline rounded-full px-2 py-0.5 font-semibold text-brand-primary transition-colors hover:bg-brand-primary-soft active:opacity-80';

/** 피드·댓글 `@닉` — 밑줄 X · soft pill hover */
export const feedNicknameLinkClassName =
  'inline max-w-full truncate rounded-full px-1.5 py-0.5 font-semibold no-underline transition-colors hover:bg-black/[0.06] active:opacity-80';

export const fieldHintClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-[color:var(--color-lp-muted)]';

export const fieldSuccessClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-emerald-500';

export const fieldErrorClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-red-400';

export const pillInputErrorClassName =
  'border-red-400/70 focus:border-red-400 focus:ring-red-400/20';
