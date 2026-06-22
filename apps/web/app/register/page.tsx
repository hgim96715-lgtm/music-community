
import Link from "next/link";
import { registerAction } from "./actions";


type RegisterPageProps={
    searchParams:Promise<{callbackUrl?:string}>;
}


export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";

  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">회원가입</h1>
        <p className="mt-2 text-sm text-neutral-600">
          이메일로 계정을 만드세요.
        </p>

        <form className="mt-6 space-y-4" action={registerAction}>
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-neutral-700"
            >
              비밀번호 확인
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            가입하기
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-600">
          이미 계정이 있으신가요?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-neutral-900 underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}