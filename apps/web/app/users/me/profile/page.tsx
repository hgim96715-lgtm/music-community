'use client';

import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { fetchFriendRequests, patchUserProfile } from '@/lib/api';
import {
  authPageClassName,
  authSubmitClassName,
  fieldErrorClassName,
  formLegendClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 프로필 수정 — 설정과 분리 */
export default function MyProfileEditPage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/profile');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFriendRequests()
      .then((requests) => {
        if (!cancelled) {
          setRequestCount(requests.received.length + requests.sent.length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      const updated = await patchUserProfile({
        nickname: nickname.trim(),
        bio: bio.trim() || null,
      });
      setUser({ ...user, ...updated });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '프로필 업데이트에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div>
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          마이 홈
        </Link>
      </div>

      <MyHomeSubShell
        nickname={user.nickname}
        title="프로필"
        subtitle="닉네임 · 한 줄 소개"
        active="profile"
        requestCount={requestCount}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={formLegendClassName}>닉네임</label>
            <PillInput
              label="닉네임"
              name="nickname"
              icon={User}
              value={nickname}
              onChange={setNickname}
              autoComplete="username"
            />
          </div>
          <div>
            <label className={formLegendClassName}>한 줄 소개</label>
            <PillTextarea
              label="한 줄 소개"
              name="bio"
              placeholder="없어도 괜찮아요"
              value={bio}
              onChange={setBio}
              rows={3}
            />
          </div>
          {error ? <p className={fieldErrorClassName}>{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className={authSubmitClassName}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : '저장'}
          </button>
        </form>
      </MyHomeSubShell>
    </main>
  );
}
