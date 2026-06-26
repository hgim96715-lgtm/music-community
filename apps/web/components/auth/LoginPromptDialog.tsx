'use client';

import Link from 'next/link';
import { buildLoginHref } from '@/lib/redirect';

type LoginPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  /** 로그인 성공 후 이동할 내부 path — URL에는 `?next=` 로 붙음 */
  redirectPath?: string;
  title?: string;
  description?: string;
};

export function LoginPromptDialog({
  open,
  onClose,
  redirectPath,
  title = '로그인이 필요해요',
  description = '추천을 올리려면 로그인해 주세요.',
}: LoginPromptDialogProps) {
  if (!open) return null;

  const loginHref = buildLoginHref(redirectPath);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
      onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}>
        <h2 id="login-prompt-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900">
            닫기
          </button>
          <Link
            href={loginHref}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
