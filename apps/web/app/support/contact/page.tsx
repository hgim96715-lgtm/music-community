'use client';
import { PillInput } from '@/components/auth/PillInput';
import { PillTextarea } from '@/components/auth/PillTextarea';
import { useAuth } from '@/components/auth/AuthProvider';
import { createSupportContact } from '@/lib/api';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
  fieldSuccessClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/** 문의하기 — POST /support/contact (Nest SMTP) */
export default function SupportContactPage() {
  const { user } = useAuth();
  const [fromEmail, setFromEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFromEmail((prev) => prev || user.email);
    setNickname((prev) => prev || user.nickname);
  }, [user]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setPending(true);
    try {
      await createSupportContact({
        fromEmail: fromEmail.trim(),
        nickname: nickname.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
      });
      setSuccess(true);
      setSubject('');
      setBody('');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '문의 메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={authPageClassName}>
      <div className="mb-6">
        <Link
          href="/support"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          고객지원
        </Link>
      </div>
      <article>
        <h1 className={authTitleClassName}>문의하기</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          서비스 이용 중 궁금한 점이나 신고가 있으면 남겨 주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <PillInput
            label="회신 이메일"
            name="fromEmail"
            type="email"
            icon={Mail}
            value={fromEmail}
            onChange={setFromEmail}
            autoComplete="email"
            required
          />
          <PillInput
            label="닉네임 (선택)"
            name="nickname"
            icon={User}
            value={nickname}
            onChange={setNickname}
            autoComplete="nickname"
          />
          <PillInput
            label="제목"
            name="subject"
            icon={Mail}
            value={subject}
            onChange={setSubject}
            required
            maxLength={120}
          />
          <PillTextarea
            label="문의 내용"
            name="body"
            value={body}
            onChange={setBody}
            required
            maxLength={2000}
            rows={6}
            placeholder="닉네임·상황·재현 방법을 같이 적어 주시면 더 빨라요."
          />
          {error ? (
            <p className={fieldErrorClassName} role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className={fieldSuccessClassName} role="status">
              문의가 전송되었어요. 답변은 회신 이메일로 안내합니다.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className={`${authSubmitClassName} mt-1`}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? '전송 중…' : '문의 보내기'}
          </button>
        </form>
        <p className="mt-8 text-xs text-neutral-500">
          문의는 서버 메일(SMTP)로 운영자에게 전달됩니다.
        </p>
      </article>
    </main>
  );
}
