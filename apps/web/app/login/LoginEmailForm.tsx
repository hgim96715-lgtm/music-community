'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithEmailAction, type LoginEmailFormState } from './actions';

const initialState: LoginEmailFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50">
      {pending ? '로그인 중...' : '로그인'}
    </button>
  );
}

type Props = {
  redirectTo: string;
};

export default function LoginEmailForm({ redirectTo }: Props) {
  const [state, formAction] = useActionState(
    signInWithEmailAction,
    initialState,
  );

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
