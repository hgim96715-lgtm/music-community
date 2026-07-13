'use client';

import { PillInput } from '@/components/auth/PillInput';
import { login } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  authLinkClassName,
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
} from '@/lib/form';
import {
  type AuthFieldErrors,
  hasAuthFieldErrors,
  mapAuthApiError,
  validateLoginFields,
} from '@/lib/authFormErrors';
import {
  buildRegisterHref,
  getRedirectPathFromSearchParams,
  REDIRECT_QUERY_KEY,
} from '@/lib/redirect';
import { Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useActionState, useState } from 'react';
import { getApiBaseUrl } from '@/lib/fetchApi';

function LoginForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getRedirectPathFromSearchParams(searchParams);
  const oauthError = searchParams.get('oauthError');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const oauthErrorMessage =
    oauthError === 'email_not_verified'
      ? '인증된 이메일이 필요합니다. 다른 계정으로 시도해 주세요.'
      : oauthError === 'email_missing'
        ? '이메일 정보를 받지 못했습니다. 다른 계정으로 시도해 주세요.'
        : oauthError === 'account_link_failed'
          ? '계정 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          : oauthError === 'provider_error'
            ? '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
            : oauthError
              ? '소셜 로그인에 실패했습니다.'
              : null;

  const googleHref = `${getApiBaseUrl()}/auth/oauth/google?${REDIRECT_QUERY_KEY}=${encodeURIComponent(redirectPath)}`;
  const naverHref = `${getApiBaseUrl()}/auth/oauth/naver?${REDIRECT_QUERY_KEY}=${encodeURIComponent(redirectPath)}`;

  function resetLoginForm() {
    setEmail('');
    setPassword('');
  }

  async function submitLogin(
    _prev: AuthFieldErrors,
    _formData: FormData,
  ): Promise<AuthFieldErrors> {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const clientErrors = validateLoginFields(trimmedEmail, trimmedPassword);
    if (hasAuthFieldErrors(clientErrors)) return clientErrors;

    try {
      const data = await login(trimmedEmail, trimmedPassword);
      setUser(data.user);
      resetLoginForm();
      router.push(redirectPath);
      return {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '로그인에 실패했습니다.';
      return mapAuthApiError(message);
    }
  }

  const [errors, formAction, isPending] = useActionState(submitLogin, {});

  return (
    <main className={authPageClassName}>
      <header className="mb-8">
        <h1 className={`${authTitleClassName} text-center`}>로그인</h1>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <PillInput
          label="이메일"
          value={email}
          onChange={setEmail}
          name="email"
          type="text"
          autoComplete="email"
          required
          icon={Mail}
          error={errors.email}
        />
        <PillInput
          label="비밀번호"
          value={password}
          onChange={setPassword}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          icon={Lock}
          showPasswordToggle
          error={errors.password}
        />
        {errors.form ? (
          <p className={fieldErrorClassName} role="alert" aria-live="polite">
            {errors.form}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className={`${authSubmitClassName} mt-2`}>
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending ? '로그인 중…' : '로그인'}
        </button>
      </form>

      {oauthErrorMessage ? (
        <p
          className={`${fieldErrorClassName} mt-4`}
          role="alert"
          aria-live="polite">
          {oauthErrorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          또는
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <a
          href={googleHref}
          className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50">
          Google로 계속하기
        </a>
        <a
          href={naverHref}
          className="inline-flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50">
          Naver로 계속하기
        </a>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-400">
            Kakao로 계속하기
          </button>
          <p className="px-1 text-center text-xs leading-relaxed text-neutral-500">
            카카오 비즈 앱으로 변경 후 이메일 동의가 되면 카카오 로그인을 사용할
            수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-400">
            Apple로 계속하기
          </button>
          <p className="px-1 text-center text-xs leading-relaxed text-neutral-500">
            Apple Developer Program(유료) 등록 후 Sign in with Apple를 연결할 수
            있습니다.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-neutral-600">
        아직 회원이 아니신가요?{' '}
        <Link
          href={buildRegisterHref(redirectPath)}
          className={authLinkClassName}>
          회원가입
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className={authPageClassName}>
          <p className="text-center text-sm text-neutral-500">불러오는 중…</p>
        </main>
      }>
      <LoginForm />
    </Suspense>
  );
}
