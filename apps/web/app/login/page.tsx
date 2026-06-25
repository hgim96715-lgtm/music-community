'use client';

import { login } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useActionState } from 'react';

type FormState = { message?: string };

const inputClassName =
  'mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm';
const labelClassName = 'text-sm font-medium';

export default function LoginPage() {
  const router = useRouter();

  async function submitLogin(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    if (!email || !password) {
      return { message: '이메일과 비밀번호를 입력해주세요.' };
    }
    try {
      await login(email, password);
      router.push('/recommendations');
    } catch (error) {
      return {
        message:
          error instanceof Error ? error.message : '로그인에 실패했습니다.',
      };
    }
    return {};
  }

  const [state, formAction, isPending] = useActionState(submitLogin, {});

  return (
    <main className="mx-auto max-w-lg p-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">로그인</h1>
        <p className="mt-1 text-sm text-neutral-600">
          아직 회원이 아니신가요?{' '}
          <Link href="/register" className="text-neutral-900 underline">
            회원가입
          </Link>
        </p>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={labelClassName}>
            이메일
          </label>
          <input
            type="text"
            id="email"
            name="email"
            required
            autoComplete="email"
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
            autoComplete="current-password"
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
          {isPending ? '로그인 중…' : '로그인'}
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
