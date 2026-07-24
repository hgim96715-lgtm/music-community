'use client';
import {
  EMAIL_DOMAIN_CUSTOM,
  EMAIL_DOMAIN_PRESETS,
  buildEmail,
} from '@/lib/email';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldSuccessClassName,
  pillInputClassName,
  pillInputErrorClassName,
} from '@/lib/form';
import { Mail } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

type PillEmailInputProps = {
  local: string;
  onLocalChange: (value: string) => void;
  domain: string;
  onDomainChange: (value: string) => void;
  customDomain: string;
  onCustomDomainChange: (value: string) => void;
  error?: string;
  hint?: string;
  success?: string;
};

export function PillEmailInput({
  local,
  onLocalChange,
  domain,
  onDomainChange,
  customDomain,
  onCustomDomainChange,
  error,
  hint,
  success,
}: PillEmailInputProps) {
  const localId = useId();
  const domainId = useId();
  const customDomainId = useId();
  const feedbackId = useId();

  const fullEmail = buildEmail(local, domain, customDomain);
  const isCustom = domain === EMAIL_DOMAIN_CUSTOM;

  const inputClass = (extra = '') =>
    `${pillInputClassName} ${error ? pillInputErrorClassName : ''} ${extra}`.trim();

  return (
    <div>
      <span className="sr-only">이메일</span>
      <input type="hidden" name="email" value={fullEmail} />
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89880]"
            aria-hidden
          />
          <input
            id={localId}
            name="emailLocal"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="이메일"
            value={local}
            onChange={(e) => onLocalChange(e.target.value.replace(/@/g, ''))}
            aria-invalid={error ? true : undefined}
            className={`${inputClass()} pl-10 pr-4`}
          />
        </div>
        <span className="shrink-0 text-sm font-medium text-[#a89880]">@</span>
        {isCustom ? (
          <input
            id={customDomainId}
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="example.com"
            value={customDomain}
            onChange={(e) => onCustomDomainChange(e.target.value)}
            className={`${inputClass()} min-w-0 flex-1 px-4`}
          />
        ) : null}
        <select
          id={domainId}
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          aria-label="이메일 도메인"
          className={`${inputClass()} shrink-0 px-3 ${isCustom ? 'max-w-[7rem]' : 'flex-1'}`}>
          {EMAIL_DOMAIN_PRESETS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
          <option value={EMAIL_DOMAIN_CUSTOM}>직접 입력</option>
        </select>
      </div>
      {error ? (
        <p
          id={feedbackId}
          className={fieldErrorClassName}
          role="alert"
          aria-live="polite">
          {error}
        </p>
      ) : success ? (
        <p id={feedbackId} className={fieldSuccessClassName} aria-live="polite">
          {success}
        </p>
      ) : hint ? (
        <p id={feedbackId} className={fieldHintClassName}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
