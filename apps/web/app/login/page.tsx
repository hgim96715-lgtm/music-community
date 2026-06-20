import { signInWithGoogle } from "./actions";

type LoginPageProps={
    searchParams:Promise<{callbackUrl?:string}>;
}


export default async function LoginPage({searchParams}:LoginPageProps) {
    const {callbackUrl}=await searchParams;
    const redirectTo=callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
    
  return (
    <main className="min-h-full flex-1 bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">로그인</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Google 계정으로 시작하세요.
        </p>

        <form className="mt-6" action={signInWithGoogle.bind(null, redirectTo)}>
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Google로 계속하기
          </button>
        </form>
      </div>
    </main>
  );
}
