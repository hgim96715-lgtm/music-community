'use client';

import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { PillInput } from '@/components/auth/PillInput';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { cancelWithdraw, fetchFriendRequests, withdrawMe } from '@/lib/api';
import {
  appNavLinkClassName,
  authPageClassName,
  fieldErrorClassName,
} from '@/lib/form';
import { brandPillBtn, dialogBack, dialogPanel } from '@/lib/neobrutal';
import { fetchMyRooms, type ApiRoom } from '@/lib/rooms';
import { ChevronLeft, KeyRound, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const WITHDRAW_GRACE_DAYS = 7;

type WithdrawStep = 'loading' | 'owner' | 'confirm';

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** 설정 — 계정·약관 · 로그아웃 · 회원탈퇴 */
export default function MySettingsPage() {
  const router = useRouter();
  const { user, isLoading, clearSession, refreshUser } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('loading');
  const [ownedRooms, setOwnedRooms] = useState<ApiRoom[]>([]);
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [welcomeBackOpen, setWelcomeBackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const itemClassName =
    'w-full flex items-center justify-between rounded-xl border border-dashed border-[rgb(31_26_22/0.12)] px-3.5 py-3 text-sm text-[#a89880]';

  const isWithdrawing = Boolean(user?.deletedAt);
  const daysLeft = daysUntil(user?.withdrawScheduledAt ?? null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/settings');
  }, [isLoading, user, router]);

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

  function closeWithdraw() {
    if (pending) return;
    setWithdrawOpen(false);
    setWithdrawStep('loading');
    setOwnedRooms([]);
    setConfirm('');
    setPassword('');
    setError('');
  }

  async function openWithdraw() {
    if (!user) return;
    setError('');
    setConfirm('');
    setPassword('');
    setOwnedRooms([]);
    setWithdrawStep('loading');
    setWithdrawOpen(true);
    try {
      const rooms = await fetchMyRooms();
      const owned = rooms.filter(
        (r) => r.ownerId === user.id && r.status === 'active',
      );
      setOwnedRooms(owned);
      setWithdrawStep(owned.length > 0 ? 'owner' : 'confirm');
    } catch {
      // 방 목록 실패해도 탈퇴는 진행 가능
      setOwnedRooms([]);
      setWithdrawStep('confirm');
    }
  }

  async function handleWithdraw() {
    if (!user) return;
    setError('');
    setPending(true);
    try {
      const result = await withdrawMe({
        confirm: confirm.trim(),
        password: password || undefined,
      });
      clearSession();
      router.replace(
        `/login?withdrawn=1&days=${encodeURIComponent(String(result.graceDays))}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '탈퇴 예약에 실패했습니다.',
      );
    } finally {
      setPending(false);
    }
  }

  async function handleCancelWithdraw() {
    setError('');
    setCancelPending(true);
    try {
      await cancelWithdraw();
      await refreshUser();
      setWelcomeBackOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '탈퇴 취소에 실패했습니다.',
      );
    } finally {
      setCancelPending(false);
    }
  }

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
        title="설정"
        subtitle="계정 · 약관 · 고객지원 · 로그아웃"
        active="settings"
        requestCount={requestCount}>
        {isWithdrawing ? (
          <p className="mb-3 text-xs leading-relaxed text-red-600/90">
            탈퇴 예정
            {daysLeft != null
              ? ` · 약 ${daysLeft}일 뒤 정리`
              : ` · ${WITHDRAW_GRACE_DAYS}일 유예`}
            . 아래 「탈퇴 취소」로 되돌릴 수 있어요.
          </p>
        ) : null}

        {error && isWithdrawing ? (
          <p className={`${fieldErrorClassName} mb-2`} role="alert">
            {error}
          </p>
        ) : null}

        <ul className="flex flex-col gap-1.5">
          <li>
            <Link href="/support" className={itemClassName}>
              고객지원
            </Link>
          </li>
          <li>
            <Link href="/legal/terms" className={itemClassName}>
              이용약관
            </Link>
          </li>
          <li>
            <Link href="/legal/privacy" className={itemClassName}>
              개인정보 처리방침
            </Link>
          </li>
          <li>
            {isWithdrawing ? (
              <button
                type="button"
                onClick={handleCancelWithdraw}
                disabled={cancelPending}
                className={itemClassName}>
                {cancelPending ? '취소 중…' : '탈퇴 취소'}
                <span className="text-[11px] font-medium text-brand-primary">
                  {daysLeft != null ? `${daysLeft}일 남음` : '유예 중'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openWithdraw}
                className={itemClassName}>
                회원탈퇴
              </button>
            )}
          </li>
        </ul>

        <div className="mt-6 border-t border-[rgb(31_26_22/0.12)] pt-4">
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push('/login');
            }}
            className={`${appNavLinkClassName} w-full border border-red-200/80 bg-white py-2.5 text-center text-red-600 shadow-[2px_2px_0_rgb(46_38_31/0.12)]`}>
            로그아웃
          </button>
        </div>
      </MyHomeSubShell>

      <FeedDialog
        open={welcomeBackOpen}
        onClose={() => setWelcomeBackOpen(false)}
        onConfirm={() => {
          setWelcomeBackOpen(false);
          router.push('/');
        }}
        title={`${user.nickname}님, 다시 돌아오셨군요🥹`}
        description={'우리 좋은 추억 더 쌓아 봐요.🥰'}
        confirmLabel="피드 보러 가기"
        cancelLabel="설정에 머물기"
      />

      {!isWithdrawing && withdrawOpen && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="withdraw-dialog-title"
              onClick={closeWithdraw}>
              <div
                className="relative w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}>
                <div className={dialogBack} aria-hidden />
                <div className={`${dialogPanel} p-6`}>
                  {withdrawStep === 'loading' ? (
                    <>
                      <h2
                        id="withdraw-dialog-title"
                        className="text-center text-lg font-semibold text-brand-primary">
                        회원 탈퇴
                      </h2>
                      <div className="mt-6 flex justify-center">
                        <Loader2 className="size-6 animate-spin text-brand-primary" />
                      </div>
                      <p className="mt-3 text-center text-xs text-neutral-500">
                        방장으로 있는 방 확인 중…
                      </p>
                    </>
                  ) : null}

                  {withdrawStep === 'owner' ? (
                    <>
                      <h2
                        id="withdraw-dialog-title"
                        className="text-center text-lg font-semibold text-brand-primary">
                        방장으로 있는 방이 있어요
                      </h2>
                      <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
                        탈퇴를 예약하면 유예 동안 방장 넘기기가 막혀요.
                        <br />
                        지금 넘기거나 방을 닫아 주세요. 안 하면 유예 끝에
                        다른 멤버에게 자동으로 넘어가고, 혼자인 방만 닫혀요.
                      </p>
                      <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto">
                        {ownedRooms.map((room) => (
                          <li key={room.id}>
                            <Link
                              href={`/rooms/${room.id}/settings`}
                              className="flex items-center justify-between rounded-xl border border-dashed border-[rgb(31_26_22/0.12)] px-3 py-2.5 text-sm text-brand-primary hover:bg-[rgb(31_26_22/0.03)]"
                              onClick={closeWithdraw}>
                              <span className="min-w-0 truncate font-medium">
                                {room.name}
                              </span>
                              <span className="shrink-0 text-[11px] text-neutral-500">
                                설정 · 넘기기
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex flex-col items-stretch gap-2">
                        <button
                          type="button"
                          onClick={() => setWithdrawStep('confirm')}
                          className={`${brandPillBtn} justify-center`}>
                          방 정리 없이 예약 계속
                        </button>
                        <button
                          type="button"
                          onClick={closeWithdraw}
                          className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary">
                          닫기
                        </button>
                      </div>
                    </>
                  ) : null}

                  {withdrawStep === 'confirm' ? (
                    <>
                      <h2
                        id="withdraw-dialog-title"
                        className="text-center text-lg font-semibold text-brand-primary">
                        회원 탈퇴
                      </h2>
                      <p className="mt-2 whitespace-pre-line text-center text-sm leading-relaxed text-neutral-600">
                        {`지금 예약하면 ${WITHDRAW_GRACE_DAYS}일 뒤 계정이 정리돼요.\n그 전에는 로그인해서 취소할 수 있어요.\n피드에 남긴 글·댓글은 「탈퇴한 사용자」로 남을 수 있어요.`}
                      </p>
                      <div className="mt-4 flex flex-col gap-3">
                        <PillInput
                          label={`확인 — ${user.nickname} 또는 이메일`}
                          name="withdrawConfirm"
                          icon={User}
                          value={confirm}
                          onChange={setConfirm}
                          autoComplete="off"
                          required
                          hint={`닉네임 「${user.nickname}」을 그대로 입력`}
                        />
                        <PillInput
                          label="비밀번호 (이메일 가입만)"
                          name="withdrawPassword"
                          type="password"
                          icon={KeyRound}
                          value={password}
                          onChange={setPassword}
                          autoComplete="current-password"
                          showPasswordToggle
                          hint="소셜만 쓰는 계정은 비워 두세요"
                        />
                        {error ? (
                          <p className={fieldErrorClassName} role="alert">
                            {error}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-6 flex flex-col items-stretch gap-2">
                        <button
                          type="button"
                          onClick={handleWithdraw}
                          disabled={pending || !confirm.trim()}
                          className={`${brandPillBtn} justify-center bg-red-600 disabled:opacity-50`}>
                          {pending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          {pending ? '예약 중…' : '탈퇴 예약하기'}
                        </button>
                        {ownedRooms.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              setWithdrawStep('owner');
                            }}
                            disabled={pending}
                            className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary disabled:opacity-50">
                            방장 방으로 돌아가기
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={closeWithdraw}
                          disabled={pending}
                          className="rounded-full py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary disabled:opacity-50">
                          닫기
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
