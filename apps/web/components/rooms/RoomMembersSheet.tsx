'use client';
import { useAvatarAction } from '@/components/friends/AvatarActionContext';
import { ApiRoomMemberWithUser, fetchRoomMembers } from '@/lib/rooms';
import { Loader2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  myUserId: string;
};

export function RoomMembersSheet({
  open,
  onClose,
  roomId,
  roomName,
  myUserId,
}: Props) {
  const { openSheet } = useAvatarAction();
  const [members, setMembers] = useState<ApiRoomMemberWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchRoomMembers(roomId)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '멤버 목록을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, roomId]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="방 멤버"
      onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[18px] bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md sm:rounded-[18px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-neutral-800">
              이 방 · {members.length || '…'}명
            </p>
            <p className="truncate text-[12px] text-neutral-400">{roomName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            aria-label="닫기">
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <p className="px-3 py-8 text-center text-sm text-red-500">
              {error}
            </p>
          ) : (
            <ul className="flex flex-col">
              {members.map((m) => {
                const mine = m.userId === myUserId;
                const owner = m.role === 'owner';
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        openSheet({
                          id: m.user.id,
                          nickname: m.user.nickname,
                        });
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-neutral-50">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dce8ef] text-[#335b73]">
                        <User className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-neutral-800">
                        @{m.user.nickname}
                      </span>
                      {owner ? (
                        <span className="shrink-0 rounded-full bg-brand-primary-soft px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                          방장
                        </span>
                      ) : null}
                      {mine ? (
                        <span className="shrink-0 text-[11px] font-medium text-neutral-400">
                          나
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
