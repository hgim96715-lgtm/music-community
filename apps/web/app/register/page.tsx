'use client';

import { PillInput } from '@/components/auth/PillInput';
import { register } from '@/lib/api';
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
  validateRegisterFields,
} from '@/lib/authFormErrors';
import {
  buildLoginHref,
  getRedirectPathFromSearchParams,
} from '@/lib/redirect';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useActionState } from 'react';

function RegisterForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getRedirectPathFromSearchParams(searchParams);

  async function submitRegister(
    _prev: AuthFieldErrors,
    formData: FormData,
  ): Promise<AuthFieldErrors> {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    const nickname = String(formData.get('nickname') ?? '').trim();

    const clientErrors = validateRegisterFields(email, password, nickname);
    if (hasAuthFieldErrors(clientErrors)) return clientErrors;

    try {
      const data = await register(email, password, nickname);
      setUser(data.user);
      router.push(redirectPath);
      return {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      return mapAuthApiError(message);
    }
  }

  const [errors, formAction, isPending] = useActionState(submitRegister, {});

  return (
    <main className={authPageClassName}>
      <header className="mb-8">
        <h1 className={`${authTitleClassName} text-center`}>회원가입</h1>
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
          label="닉네임"
          name="nickname"
          type="text"
          autoComplete="nickname"
          required
          icon={User}
          error={errors.nickname}
        />
        <PillInput
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          icon={Lock}
          showPasswordToggle
          hint="8자 이상"
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
          {isPending ? '가입 중…' : '회원가입'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        이미 계정이 있으신가요?{' '}
        <Link href={buildLoginHref(redirectPath)} className={authLinkClassName}>
          로그인
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className={authPageClassName}>
          <p className="text-center text-sm text-neutral-500">불러오는 중…</p>
        </main>
      }>
      <RegisterForm />
    </Suspense>
  );
}
