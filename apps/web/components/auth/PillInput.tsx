'use client';

import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import {
  fieldErrorClassName,
  fieldHintClassName,
  pillInputClassName,
  pillInputErrorClassName,
} from '@/lib/form';

type PillInputProps = {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'url';
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  icon: LucideIcon;
  showPasswordToggle?: boolean;
  /** 안내 문구 — 레퍼런스 이미지의 회색 설명 (에러 없을 때) */
  hint?: string;
  /** 필드 아래 빨간 에러 */
  error?: string;
};

export function PillInput({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  maxLength,
  icon: Icon,
  showPasswordToggle = false,
  hint,
  error,
}: PillInputProps) {
  const id = useId();
  const feedbackId = useId();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType =
    isPassword && showPasswordToggle && passwordVisible ? 'text' : type;
  const hasFeedback = Boolean(error || hint);

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          id={id}
          name={name}
          type={inputType}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasFeedback ? feedbackId : undefined}
          className={`${pillInputClassName} pl-10 ${error ? pillInputErrorClassName : ''} ${showPasswordToggle && isPassword ? 'pr-11' : 'pr-4'}`}
        />
        {showPasswordToggle && isPassword ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
            aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}>
            {passwordVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={feedbackId}
          className={fieldErrorClassName}
          role="alert"
          aria-live="polite">
          {error}
        </p>
      ) : hint ? (
        <p id={feedbackId} className={fieldHintClassName}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
