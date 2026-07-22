'use client';

import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { adminFetchJson, adminFetchVoid } from '@/lib/adminFetch';
import type { ApiAdminNotice } from '@/lib/apiTypes';
import { postCard } from '@/lib/neobrutal';
import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';

type NoticeForm = {
  title: string;
  body: string;
  published: boolean;
};

const emptyForm = (): NoticeForm => ({
  title: '',
  body: '',
  published: false,
});

export default function AdminNoticesPage() {
  const [rows, setRows] = useState<ApiAdminNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeForm>(emptyForm);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      setIsLoading(true);
      try {
        const data = await adminFetchJson<ApiAdminNotice[]>('/notices');
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setError('공지 목록을 불러오지 못했어요.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function startEdit(row: ApiAdminNotice) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      body: row.body,
      published: row.published,
    });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPendingId(editingId ?? 'new');
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      published: form.published,
    };
    try {
      if (editingId) {
        const updated = await adminFetchJson<ApiAdminNotice>(
          `/notices/${editingId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        setRows((prev) =>
          prev.map((row) => (row.id === editingId ? updated : row)),
        );
      } else {
        const created = await adminFetchJson<ApiAdminNotice>('/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setRows((prev) => [created, ...prev]);
      }
      setEditingId(null);
      setForm(emptyForm());
    } catch {
      setError(editingId ? '공지를 수정하지 못했어요.' : '공지를 작성하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }

  async function togglePublished(row: ApiAdminNotice) {
    setPendingId(row.id);
    try {
      const updated = await adminFetchJson<ApiAdminNotice>(
        `/notices/${row.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: !row.published }),
        },
      );
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? updated : r)),
      );
    } catch {
      setError('게시 상태를 변경하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`「${title}」 공지를 삭제할까요?`)) return;
    setPendingId(id);
    try {
      await adminFetchVoid(`/notices/${id}`, { method: 'DELETE' });
      setRows((prev) => prev.filter((row) => row.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm());
      }
    } catch {
      setError('공지를 삭제하지 못했어요.');
    } finally {
      setPendingId(null);
    }
  }

  const formBusy = pendingId === 'new' || pendingId === editingId;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brand-primary">공지 관리</h1>

      <section className={`${postCard} space-y-4 p-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-brand-primary">
            {editingId ? '공지 수정' : '새 공지'}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={startCreate}
              className="text-xs text-neutral-500 underline">
              새로 작성
            </button>
          ) : null}
        </div>
        <form onSubmit={(e) => void submitForm(e)} className="space-y-3">
          <PillInput
            label="제목"
            name="title"
            icon={Megaphone}
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            required
            maxLength={120}
          />
          <PillTextarea
            label="본문"
            name="body"
            value={form.body}
            onChange={(v) => setForm((f) => ({ ...f, body: v }))}
            required
            maxLength={10000}
            rows={6}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="size-4 rounded border-neutral-300"
            />
            저장 시 바로 게시
          </label>
          <button
            type="submit"
            disabled={formBusy}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {formBusy ? '저장 중…' : editingId ? '수정 저장' : '공지 작성'}
          </button>
        </form>
      </section>

      {isLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">등록된 공지가 없어요.</p>
      ) : (
        <div className={`${postCard} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="px-3 py-2 font-medium">제목</th>
                <th className="px-3 py-2 font-medium">상태</th>
                <th className="px-3 py-2 font-medium">게시일</th>
                <th className="px-3 py-2 font-medium">작성자</th>
                <th className="px-3 py-2 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = pendingId === row.id;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0">
                    <td className="max-w-[200px] truncate px-3 py-2 font-medium text-brand-primary">
                      {row.title}
                    </td>
                    <td className="px-3 py-2">
                      {row.published ? (
                        <span className="text-brand-primary">게시</span>
                      ) : (
                        <span className="text-neutral-400">숨김</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-neutral-500">
                      {row.publishedAt
                        ? formatDate(row.publishedAt)
                        : '—'}
                    </td>
                    <td className="px-3 py-2">{row.author.nickname}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(row)}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs disabled:opacity-50">
                          수정
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void togglePublished(row)}
                          className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs disabled:opacity-50">
                          {row.published ? '숨김' : '게시'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void remove(row.id, row.title)}
                          className="rounded-full border border-red-200 px-2.5 py-1 text-xs text-red-600 disabled:opacity-50">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
