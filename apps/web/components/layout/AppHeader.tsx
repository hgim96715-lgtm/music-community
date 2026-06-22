import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";
import { formatTodayLine } from "@/lib/date";
import Link from "next/link";
import UploadButton from "../UploadButton";

export default async function AppHeader() {
  const session = await auth();

  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/">
            <h1 className="text-lg font-semibold text-neutral-900">
              Music Community 🎧
            </h1>
          </Link>
          <p className="mt-1 text-sm text-neutral-600">{formatTodayLine()}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-neutral-600 sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              {session.user.role === "admin" && (
                <Link href="/admin" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  관리자
                </Link>
              )}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              로그인
            </Link>
          )}
          {session?.user?.role!=='admin' && <UploadButton isLoggedIn={!!session?.user} />}
        </div>
      </div>
    </header>
  );
}