'use client';

import { authLinkClassName } from '@/lib/form';
import {
  brandPillBtn,
  dialogPanel,
} from '@/lib/neobrutal';
import { buildLoginHref, buildRegisterHref } from '@/lib/redirect';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const loginHref = buildLoginHref(redirectPath);
  const registerHref = buildRegisterHref(redirectPath);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
      onClick={onClose}>
      <div
        className="relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}>
        <div className={`${dialogPanel} p-6`}>
          <h2
            id="login-prompt-title"
            className="text-center text-lg font-semibold text-brand-primary">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-[#a89880]">
            {description}
          </p>
          <div className="mt-6 flex flex-col items-stretch gap-2">
            <Link href={loginHref} className={`${brandPillBtn} justify-center`}>
              로그인
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full py-2 text-sm font-medium text-[#a89880] transition-colors hover:text-brand-primary">
              닫기
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-[#a89880]">
            계정이 없으신가요?{' '}
            <Link href={registerHref} className={`${authLinkClassName} text-xs`}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
