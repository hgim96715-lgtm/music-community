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
} from '@/lib/redirect';
import { Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useActionState } from 'react';

function LoginForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getRedirectPathFromSearchParams(searchParams);

  async function submitLogin(
    _prev: AuthFieldErrors,
    formData: FormData,
  ): Promise<AuthFieldErrors> {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();

    const clientErrors = validateLoginFields(email, password);
    if (hasAuthFieldErrors(clientErrors)) return clientErrors;

    try {
      const data = await login(email, password);
      setUser(data.user);
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
          name="email"
          type="text"
          autoComplete="email"
          required
          icon={Mail}
          error={errors.email}
        />
        <PillInput
          label="비밀번호"
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

      <p className="mt-8 text-center text-sm text-neutral-600">
        아직 회원이 아니신가요?{' '}
        <Link href={buildRegisterHref(redirectPath)} className={authLinkClassName}>
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
