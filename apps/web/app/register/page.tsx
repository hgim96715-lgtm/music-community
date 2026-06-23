import Link from 'next/link';
import RegisterEmailForm from './RegisterEmailForm';

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo =
    callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')
      ? callbackUrl
      : '/';

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">회원가입</h1>
        <p className="mt-2 text-sm text-neutral-600">
          이메일로 계정을 만드세요.
        </p>

        <RegisterEmailForm redirectTo={redirectTo} />

        <p className="mt-4 text-center text-sm text-neutral-600">
          이미 계정이 있으신가요?{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-neutral-900 underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
