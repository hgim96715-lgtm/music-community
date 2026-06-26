'use client';

import { register } from '@/lib/api';
import {
  buildLoginHref,
  getRedirectPathFromSearchParams,
} from '@/lib/redirect';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Suspense, useActionState } from 'react';

type FormState = { message?: string };

const inputClassName =
  'mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm';
const labelClassName = 'text-sm font-medium';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getRedirectPathFromSearchParams(searchParams);

  async function submitRegister(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    const nickname = String(formData.get('nickname') ?? '').trim();

    if (!email || !password || !nickname) {
      return { message: '모든 항목을 입력해주세요.' };
    }

    try {
      await register(email, password, nickname);
      router.push(redirectPath);
      return {};
    } catch (error) {
      return {
        message:
          error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      };
    }
  }

  const [state, formAction, isPending] = useActionState(submitRegister, {});

  return (
    <main className="mx-auto max-w-lg p-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">회원가입</h1>
        <p className="mt-1 text-sm text-neutral-600">
          이미 계정이 있으신가요?{' '}
          <Link
            href={buildLoginHref(redirectPath)}
            className="text-neutral-900 underline">
            로그인
          </Link>
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={labelClassName}>
            이메일
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="nickname" className={labelClassName}>
            닉네임
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            required
            autoComplete="nickname"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="new-password"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending ? '가입 중…' : '회원가입'}
        </button>

        {state.message ? (
          <p className="text-sm text-red-500" aria-live="polite">
            {state.message}
          </p>
        ) : null}
      </form>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg p-8">
          <p className="text-sm text-neutral-500">불러오는 중…</p>
        </main>
      }>
      <RegisterForm />
    </Suspense>
  );
}
