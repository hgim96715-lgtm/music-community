/** 인증·작성 폼 — pill 스타일 (로그인·회원가입·/new 공용 예정) */

export const authPageClassName =
  'mx-auto flex min-h-screen max-w-lg flex-col bg-brand-bg px-5 py-10';

export const authTitleClassName =
  'text-2xl font-semibold text-brand-primary';

export const pillInputClassName =
  'w-full rounded-full border border-neutral-200 bg-white py-2.5 text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';

export const pillTextareaClassName =
  'w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20';

export const formLegendClassName = 'text-sm font-medium text-brand-primary';

export const appHeaderClassName =
  'border-b border-[#353535]/10 bg-brand-bg';

export const appHeaderInnerClassName =
  'mx-auto flex max-w-lg items-center justify-between px-5 py-3.5';

export const appLogoClassName =
  'inline-block rounded-full border border-[#353535]/10 bg-brand-primary-soft px-2.5 py-1 text-sm font-semibold tracking-tight text-brand-primary shadow-[1px_1px_0_var(--color-brand-shadow-soft)] transition-[transform,box-shadow] duration-150 active:translate-x-px active:translate-y-px active:shadow-none';

export const appNavLinkClassName =
  'rounded-full px-2.5 py-1 text-sm font-medium text-neutral-500 transition-colors hover:bg-brand-primary-soft hover:text-brand-primary';

export const authSubmitClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50';

/** 보조 링크 — 밑줄 X · hover 시 soft pill */
export const authLinkClassName =
  'inline rounded-full px-2 py-0.5 font-semibold text-brand-primary transition-colors hover:bg-brand-primary-soft active:opacity-80';

export const fieldHintClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-neutral-500';

export const fieldSuccessClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-emerald-600';

export const fieldErrorClassName =
  'mt-1.5 px-1 text-xs leading-relaxed text-red-500';

export const pillInputErrorClassName =
  'border-red-400 focus:border-red-500 focus:ring-red-500/20';
