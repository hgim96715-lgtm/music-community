'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  authPageClassName,
  authTitleClassName,
  fieldErrorClassName,
} from '@/lib/form';
import {
  fetchRoom,
  loadRoomChatThemeCached,
  saveRoomChatThemeCached,
  type ApiRoom,
} from '@/lib/rooms';
import {
  setRoomThemeBackgroundUrl,
  setRoomThemePreset,
} from '@/lib/roomThemeStorage';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROOM_THEME_PRESETS = [
  {
    id: 'lp-bar',
    label: 'LP Bar',
    hint: '기본 · brass',
    swatch: 'linear-gradient(160deg, #1e1915 40%, #c9a66b 120%)',
  },
  {
    id: 'cream-paper',
    label: '크림 페이퍼',
    hint: '낮 · 카페',
    swatch: 'linear-gradient(160deg, #f3ebe3 30%, #e8d4b8 100%)',
  },
  {
    id: 'midnight',
    label: '미드나잇',
    hint: '더 어두운 ink',
    swatch: 'linear-gradient(160deg, #0c0a09 40%, #2a241e 100%)',
  },
  {
    id: 'fan-pink',
    label: '팬핑크',
    hint: '웜 핑크',
    swatch: 'linear-gradient(160deg, #2a181c 35%, #e8a0b0 120%)',
  },
] as const;

type RoomThemePresetId = (typeof ROOM_THEME_PRESETS)[number]['id'];

export default function RoomThemePage() {
  const router = useRouter();
  const params = useParams();
  const roomId = typeof params.id === 'string' ? params.id : '';
  const { user, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [presetId, setPresetId] = useState<RoomThemePresetId>('lp-bar');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [saveHint, setSaveHint] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const saveHintTimerRef = useRef<number | null>(null);

  function flashSaveHint(ok: boolean, text: string) {
    if (saveHintTimerRef.current !== null) {
      window.clearTimeout(saveHintTimerRef.current);
    }
    setSaveHint({ ok, text });
    saveHintTimerRef.current = window.setTimeout(() => {
      setSaveHint(null);
      saveHintTimerRef.current = null;
    }, 2500);
  }

  useEffect(() => {
    return () => {
      if (saveHintTimerRef.current !== null) {
        window.clearTimeout(saveHintTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/rooms/${roomId}/theme`);
    }
  }, [authLoading, user, router, roomId]);

  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;
    async function loadTheme() {
      const prefs = await loadRoomChatThemeCached(user!.id, roomId);
      if (cancelled) return;
      setPresetId(prefs.presetId);
      setBackgroundUrl(prefs.backgroundUrl ?? '');
    }
    void loadTheme();
    return () => {
      cancelled = true;
    };
  }, [user, roomId]);

  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchRoom(roomId)
      .then((data) => {
        if (!cancelled) setRoom(data);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : '방을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, roomId]);

  if (authLoading || !user || loading) {
    return (
      <main className={`${authPageClassName} items-center justify-center`}>
        <Loader2
          className="size-6 animate-spin text-brand-primary"
          aria-hidden
        />
      </main>
    );
  }

  function onPickGallery(file: File | undefined) {
    if (!user || !roomId) return;
    if (!file?.type.startsWith('image/')) {
      flashSaveHint(false, '이미지 파일만 선택할 수 있어요.');
      return;
    }
    if (file.size > 1.2 * 1024 * 1024) {
      flashSaveHint(false, '이미지가 너무 커요. 1.2MB 이하로 골라 주세요.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return;
      void (async () => {
        try {
          await saveRoomChatThemeCached(user.id, roomId, {
            backgroundUrl: dataUrl,
          });
          setBackgroundUrl(dataUrl);
          flashSaveHint(true, '배경을 저장했어요.');
        } catch (e) {
          // 서버 저장 실패 시 로컬 캐시에만 저장
          try {
            setRoomThemeBackgroundUrl(user.id, roomId, dataUrl);
            setBackgroundUrl(dataUrl);
            flashSaveHint(
              true,
              '용량 이슈로 로컬에만 저장했어요. DB 업로드는 나중에 진행돼요.',
            );
          } catch (e2) {
            flashSaveHint(
              false,
              e2 instanceof Error ? e2.message : '배경을 저장하지 못했어요.',
            );
          }
        }
      })();
    };
    reader.onerror = () => {
      flashSaveHint(false, '이미지 파일을 읽는 중 오류가 발생했어요.');
    };
    reader.readAsDataURL(file);
  }
  return (
    <main className={`${authPageClassName} gap-6`}>
      <div className="flex items-center gap-2">
        <Link
          href={`/rooms/${roomId}/info`}
          className="inline-flex size-9 items-center justify-center rounded-full text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-brand-primary"
          aria-label="이 방">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className={`${authTitleClassName} min-w-0 flex-1`}>꾸미기</h1>
        <Link
          href={`/rooms/${roomId}`}
          className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-primary transition-colors hover:bg-[rgb(201_166_107/0.12)]">
          채팅으로
        </Link>
      </div>
      {error ? <p className={fieldErrorClassName}>{error}</p> : null}
      {room ? (
        <>
          <p className="text-[13px] text-[#a89880]">
            {room.name} · 나만 보이는 테마
          </p>
          <div className="flex w-full flex-col gap-2">
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#6b5c4c]">
              프리셋
            </p>
            <ul className="flex flex-col overflow-hidden rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.94)]">
              {ROOM_THEME_PRESETS.map((p, i) => {
                const selected = presetId === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) return;
                        setPresetId(p.id);
                        void (async () => {
                          try {
                            await saveRoomChatThemeCached(user.id, roomId, {
                              presetId: p.id,
                            });
                            flashSaveHint(
                              true,
                              `${p.label} 프리셋을 저장했어요.`,
                            );
                          } catch (e) {
                            // 서버 저장 실패 시 로컬 캐시에만 저장
                            try {
                              setRoomThemePreset(user.id, roomId, p.id);
                              flashSaveHint(
                                true,
                                '서버 저장에 실패해 로컬에만 저장했어요.',
                              );
                            } catch (e2) {
                              flashSaveHint(
                                false,
                                e2 instanceof Error
                                  ? e2.message
                                  : '프리셋을 저장하지 못했어요.',
                              );
                            }
                          }
                        })();
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgb(201_166_107/0.08)] ${
                        i < ROOM_THEME_PRESETS.length - 1
                          ? 'border-b border-[rgb(201_166_107/0.14)]'
                          : ''
                      } ${selected ? 'bg-[rgb(201_166_107/0.1)]' : ''}`}>
                      <span
                        className="size-10 shrink-0 rounded-full border border-[rgb(201_166_107/0.48)]"
                        style={{ background: p.swatch }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-[#ebe4da]">
                          {p.label}
                        </span>
                        <span className="block text-[12px] text-[#a89880]">
                          {p.hint}
                        </span>
                      </span>
                      {selected ? (
                        <span className="shrink-0 text-[12px] font-semibold text-brand-primary">
                          선택
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex w-full flex-col gap-2">
            <p className="text-[12px] text-[#a89880]">
              갤러리 또는 URL · 로컬 우선 저장 · 큰 사진은 DB 업로드가 나중에 진행될 수 있습니다.
            </p>
            <div className="flex flex-col gap-2 rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.94)] p-4">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onPickGallery(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full rounded-full border border-[rgb(201_166_107/0.28)] py-2.5 text-[13px] font-medium text-[#ebe4da] transition-colors hover:bg-[rgb(201_166_107/0.08)]">
                갤러리에서 고르기
              </button>
              <input
                type="url"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30)] px-3 py-2.5 text-[14px] text-[#ebe4da] outline-none placeholder:text-[#6b5c4c] focus:border-brand-primary"
              />
              <p className="text-[12px] text-[#a89880]">
                이미지 주소 · 프리셋 위에 깔림
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) return;
                    const next = backgroundUrl.trim() || null;
                    void (async () => {
                      try {
                        await saveRoomChatThemeCached(user.id, roomId, {
                          backgroundUrl: next,
                        });
                        setBackgroundUrl(next ?? '');
                        setError('');
                        flashSaveHint(
                          true,
                          next ? '배경을 저장했어요.' : '배경을 지웠어요.',
                        );
                      } catch (e) {
                        // 서버 저장 실패 시 로컬 캐시에만 저장
                        try {
                          setRoomThemeBackgroundUrl(user.id, roomId, next);
                          setBackgroundUrl(next ?? '');
                          setError('');
                          flashSaveHint(
                            true,
                            '용량 이슈로 로컬에만 저장했어요. DB 업로드는 나중에 진행돼요.',
                          );
                        } catch (e2) {
                          flashSaveHint(
                            false,
                            e2 instanceof Error
                              ? e2.message
                              : '배경을 저장하지 못했어요.',
                          );
                        }
                      }
                    })();
                  }}
                  className="flex-1 rounded-full bg-brand-primary py-2.5 text-[13px] font-semibold text-[color:var(--color-lp-ink)]">
                  배경 저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) return;
                    void (async () => {
                      try {
                        await saveRoomChatThemeCached(user.id, roomId, {
                          backgroundUrl: null,
                        });
                        setBackgroundUrl('');
                        flashSaveHint(true, '배경을 지웠어요.');
                      } catch (e) {
                        // 서버 저장 실패 시 로컬 캐시에만 저장
                        try {
                          setRoomThemeBackgroundUrl(user.id, roomId, null);
                          setBackgroundUrl('');
                          flashSaveHint(
                            true,
                            '용량 이슈로 로컬에만 저장했어요. DB 업로드는 나중에 진행돼요.',
                          );
                        } catch (e2) {
                          flashSaveHint(
                            false,
                            e2 instanceof Error
                              ? e2.message
                              : '배경을 지우지 못했어요.',
                          );
                        }
                      }
                    })();
                  }}
                  className="rounded-full border border-[rgb(201_166_107/0.28)] px-4 py-2.5 text-[13px] font-medium text-[#a89880]">
                  지우기
                </button>
              </div>
              {saveHint ? (
                <p
                  role="status"
                  className={`text-[13px] font-medium ${
                    saveHint.ok ? 'text-brand-primary' : 'text-red-400'
                  }`}>
                  {saveHint.text}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
