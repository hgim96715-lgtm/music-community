import Link from "next/link";
import { signInWithEmailAction, signInWithGoogle } from "./actions";
import LoginEmailForm from "./LoginEmailForm";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">로그인</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Google 또는 이메일로 시작하세요.
        </p>

        <form className="mt-6" action={signInWithGoogle.bind(null, redirectTo)}>
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Google로 계속하기
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-500">또는 이메일로</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <LoginEmailForm redirectTo={redirectTo} />

        <p className="mt-4 text-center text-sm text-neutral-600">
          계정이 없으신가요?{" "}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-neutral-900 underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}