'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchMe } from '@/lib/api';
import { setApiAccessToken } from '@/lib/authToken';
import { getRedirectPathFromSearchParams } from '@/lib/redirect';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function finishOAuth() {
      const accessToken = searchParams.get('accessToken');
      const next = getRedirectPathFromSearchParams(searchParams);

      if (!accessToken) {
        router.replace('/login');
        return;
      }
      setApiAccessToken(accessToken);
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        router.replace(next);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    }
    void finishOAuth();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setUser]);
  return (
    <main className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-neutral-500">로그인 처리 중…</p>
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-neutral-500">불러오는 중…</p>
      }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
