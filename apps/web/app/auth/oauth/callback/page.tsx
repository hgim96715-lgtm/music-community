'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { WelcomeDialog } from '@/components/auth/WelcomeDialog';
import { fetchMe } from '@/lib/api';
import { setApiAccessToken } from '@/lib/authToken';
import {
  parseOAuthProviderParam,
  setLastLoginMethod,
} from '@/lib/lastLoginMethod';
import { getRedirectPathFromSearchParams } from '@/lib/redirect';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeNickname, setWelcomeNickname] = useState('');
  const [redirectPath, setRedirectPath] = useState('/recommendations');

  function goAfterWelcome() {
    setWelcomeOpen(false);
    router.push(redirectPath);
  }

  useEffect(() => {
    let cancelled = false;
    async function finishOAuth() {
      const accessToken = searchParams.get('accessToken');
      const next = getRedirectPathFromSearchParams(searchParams);
      const provider = parseOAuthProviderParam(searchParams.get('provider'));

      if (!accessToken) {
        router.replace('/login');
        return;
      }
      setApiAccessToken(accessToken);
      if (provider) {
        setLastLoginMethod(provider);
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setWelcomeNickname(me.nickname);
        setWelcomeOpen(true);
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
      {!welcomeOpen ? (
        <p className="text-sm text-neutral-500">로그인 처리 중…</p>
      ) : null}
      <WelcomeDialog
        open={welcomeOpen}
        nickname={welcomeNickname}
        onContinue={goAfterWelcome}
        onClose={goAfterWelcome}
      />
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
