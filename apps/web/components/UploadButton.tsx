'use client';

import Link from 'next/link';
import { useRef } from 'react';

type UploadButtonProps = {
  isLoggedIn: boolean;
};

export default function UploadButton({ isLoggedIn }: UploadButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const buttonClassName =
    'rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800';

  if (isLoggedIn) {
    return (
      <Link href="/new" className={buttonClassName}>
        올리기
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => dialogRef.current?.showModal()}>
        올리기
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-lg backdrop:bg-black/40">
        <h2 className="text-lg font-semibold text-neutral-900">
          로그인이 필요합니다
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          오늘의 한곡을 올리려면 먼저 로그인해 주세요.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            닫기
          </button>
          <Link
            href="/login?callbackUrl=/new"
            className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-neutral-800">
            로그인하기
          </Link>
        </div>
      </dialog>
    </>
  );
}
