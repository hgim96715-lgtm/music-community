'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { patchUserProfile } from '@/lib/api';
import {
  appNavLinkClassName,
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
  formLegendClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
  }, [user]);

  function startEditing() {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
    setError('');
    setIsEditing(false);
  }

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
      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
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
    <main className={`${authPageClassName} gap-8`}>
      <div>
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          피드
        </Link>
      </div>

      {isEditing ? (
        <section className="flex flex-col gap-4">
          <h1 className={authTitleClassName}>프로필 수정</h1>
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
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={saving}
                className={authSubmitClassName}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : '저장'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className={appNavLinkClassName}>
                취소
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand-primary shadow-[2px_2px_0_var(--color-brand-shadow-soft)]"
            aria-hidden>
            <User className="size-7" />
          </div>
          <div>
            <h1 className={authTitleClassName}>@{user.nickname}</h1>
            {user.bio ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {user.bio}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">
                한 줄 소개가 없어요
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={startEditing}
            className={`${appNavLinkClassName} border border-neutral-200 bg-white px-4 py-2`}>
            프로필 수정
          </button>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold text-brand-primary">내 앨범</h2>
        <p className="mt-2 text-sm text-neutral-500">
          저장한 노래가 여기 모여요 — 9.1 포토카드
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-lg border border-dashed border-neutral-300 bg-white/50"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
