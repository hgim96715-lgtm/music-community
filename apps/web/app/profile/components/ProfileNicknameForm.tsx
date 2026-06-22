"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateNicknameAction,
  type ProfileFormState,
} from "../actions";

const initialState: ProfileFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
    >
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}

type Props = {
  currentNickname: string;
};

export default function ProfileNicknameForm({ currentNickname }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateNicknameAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        변경
      </button>
    );
  }

  return (
    <form className="mt-6 space-y-4" action={formAction}>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          닉네임이 변경되었습니다.
        </p>
      )}

      <div>
        <label
          htmlFor="nickname"
          className="block text-sm font-medium text-neutral-700"
        >
          새 닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          defaultValue={currentNickname}
          autoComplete="off"
          minLength={2}
          maxLength={10}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}