'use client';

import {
  appHeaderClassName,
  appHeaderInnerClassName,
  appLogoClassName,
  appNavLinkClassName,
  authLinkClassName,
} from '@/lib/form';
import { fetchMyRooms } from '@/lib/rooms';
import { User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { isRoomMuted } from '@/lib/roomMuteStorage';
import { fetchDmRequests, fetchMyDms } from '@/lib/dms';
import {
  getRoomSocket,
  onDmAccepted,
  onDmUnread,
  onRoomUnread,
} from '@/lib/roomsSocket';

export default function AppHeader() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [roomsUnread, setRoomsUnread] = useState(false);
  const [dmsUnread, setDmsUnread] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!user?.id) {
      setRoomsUnread(false);
      setDmsUnread(false);
      return;
    }
    try {
      const [mine, dms, requests] = await Promise.all([
        fetchMyRooms(),
        fetchMyDms(),
        fetchDmRequests(),
      ]);
      setRoomsUnread(
        mine.some(
          (room) => Boolean(room.unread) && !isRoomMuted(user.id, room.id),
        ),
      );
      setDmsUnread(dms.some((dm) => dm.unread) || requests.length > 0);
    } catch {
      setRoomsUnread(false);
      setDmsUnread(false);
    }
  }, [user?.id]);

  /** user가 변경될 때마다 loggedIn 상태를 업데이트 */
  useEffect(() => {
    setLoggedIn(user !== null);
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setRoomsUnread(false);
      setDmsUnread(false);
      return;
    }
    void refreshUnread();
  }, [user?.id, pathname, refreshUnread]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    try {
      getRoomSocket();
    } catch {
      return;
    }
    const offDmUnread = onDmUnread(({ unread }) => {
      if (unread) setDmsUnread(true);
      else void refreshUnread();
    });
    const offDmAccepted = onDmAccepted(() => {
      void refreshUnread();
    });
    const offRoomUnread = onRoomUnread(({ roomId, unread }) => {
      if (unread && !isRoomMuted(userId, roomId)) setRoomsUnread(true);
      else void refreshUnread();
    });
    return () => {
      offDmUnread();
      offDmAccepted();
      offRoomUnread();
    };
  }, [user?.id, refreshUnread]);

  return (
    <header className={appHeaderClassName}>
      <div className={`${appHeaderInnerClassName} gap-2`}>
        <Link
          href="/recommendations"
          className={`${appLogoClassName} shrink-0`}>
          Music Community
        </Link>
        <nav className="flex min-w-0 shrink items-center gap-0.5 sm:gap-1.5">
          {loggedIn ? (
            <>
              <Link
                href="/rooms"
                className={`relative ${appNavLinkClassName}`}
                aria-label={roomsUnread ? '방 (안 읽은 채팅)' : '방'}>
                방
                {roomsUnread ? (
                  <span
                    className="absolute right-0.5 top-1 size-1.5 rounded-full bg-brand-primary"
                    aria-hidden
                  />
                ) : null}
              </Link>
              <Link
                href="/messages"
                className={`relative ${appNavLinkClassName}`}
                aria-label={dmsUnread ? '메시지 (안 읽음)' : '메시지'}>
                메시지
                {dmsUnread ? (
                  <span
                    className="absolute right-0.5 top-1 size-1.5 rounded-full bg-brand-primary"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </>
          ) : null}

          {loggedIn && user?.role === 'admin' ? (
            <Link href="/admin" className={appNavLinkClassName}>
              관리자
            </Link>
          ) : null}
          {user ? (
            <Link
              href="/users/me"
              className="relative z-10 ml-0.5 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              aria-label="마이페이지">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="pointer-events-none size-8 rounded-full border-2 border-brand-border/20 object-cover shadow-[2px_2px_0_var(--color-brand-shadow-soft)]"
                />
              ) : (
                <span
                  className="pointer-events-none flex size-8 items-center justify-center rounded-full border-2 border-brand-border/25 bg-brand-primary-soft text-brand-primary shadow-[2px_2px_0_var(--color-brand-shadow-soft)]"
                  aria-hidden>
                  <User className="size-3.5" strokeWidth={2.25} />
                </span>
              )}
            </Link>
          ) : null}
          {isLoading || user ? null : (
            <Link href="/login" className={`${authLinkClassName} text-sm`}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
