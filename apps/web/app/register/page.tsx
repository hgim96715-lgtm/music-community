'use client';

import { PillEmailInput } from '@/components/auth/PillEmailInput';
import { PillInput } from '@/components/auth/PillInput';
import {
  checkEmailAvailable,
  checkNicknameAvailable,
  register,
} from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  authLinkClassName,
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
  fieldErrorClassName,
} from '@/lib/form';
import {
  type AuthFieldErrors,
  PASSWORD_HINT,
  getPasswordRuleError,
  hasAuthFieldErrors,
  isPasswordValid,
  mapAuthApiError,
  validateRegisterFields,
} from '@/lib/authFormErrors';
import { fieldHintClassName } from '@/lib/form';
import {
  buildEmail,
  EMAIL_DOMAIN_PRESETS,
  isValidEmailShape,
} from '@/lib/email';
import {
  buildLoginHref,
  getRedirectPathFromSearchParams,
} from '@/lib/redirect';
import { Loader2, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useActionState, useEffect, useState } from 'react';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function RegisterForm() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getRedirectPathFromSearchParams(searchParams);
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>('idle');
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState<string>(
    EMAIL_DOMAIN_PRESETS[0],
  );
  const [emailCustomDomain, setEmailCustomDomain] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] =
    useState<AvailabilityStatus>('idle');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const email = buildEmail(emailLocal, emailDomain, emailCustomDomain);

  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !isValidEmailShape(trimmed)) {
      setEmailStatus('idle');
      return;
    }

    setEmailStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const available = await checkEmailAvailable(trimmed);
        if (cancelled) return;
        setEmailStatus(available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setEmailStatus('error');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email]);

  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameStatus('idle');
      return;
    }

    setNicknameStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const available = await checkNicknameAvailable(trimmed);
        if (cancelled) return;
        setNicknameStatus(available ? 'available' : 'taken');
      } catch {
        if (!cancelled) setNicknameStatus('error');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nickname]);

  function resetRegisterForm() {
    setEmailLocal('');
    setEmailDomain(EMAIL_DOMAIN_PRESETS[0]);
    setEmailCustomDomain('');
    setEmailStatus('idle');
    setNickname('');
    setNicknameStatus('idle');
    setPassword('');
    setPasswordConfirm('');
  }

  async function submitRegister(
    _prev: AuthFieldErrors,
    _formData: FormData,
  ): Promise<AuthFieldErrors> {
    const formEmail = email.trim();
    const formNickname = nickname.trim();
    const trimmedPassword = password.trim();
    const trimmedPasswordConfirm = passwordConfirm.trim();

    const clientErrors = validateRegisterFields(
      formEmail,
      trimmedPassword,
      trimmedPasswordConfirm,
      formNickname,
    );
    if (hasAuthFieldErrors(clientErrors)) return clientErrors;

    if (formEmail && emailStatus === 'taken') {
      return { email: '이미 사용 중인 이메일입니다.' };
    }
    if (
      formEmail &&
      isValidEmailShape(formEmail) &&
      (emailStatus === 'checking' || emailStatus === 'idle')
    ) {
      return { email: '이메일 확인 중이에요. 잠시만 기다려주세요.' };
    }
    if (formEmail && emailStatus === 'error') {
      return { email: '이메일 확인에 실패했습니다. 다시 시도해주세요.' };
    }

    if (formNickname && nicknameStatus === 'taken') {
      return { nickname: '이미 사용 중인 닉네임입니다.' };
    }
    if (
      formNickname &&
      (nicknameStatus === 'checking' || nicknameStatus === 'idle')
    ) {
      return { nickname: '닉네임 확인 중이에요. 잠시만 기다려주세요.' };
    }
    if (formNickname && nicknameStatus === 'error') {
      return { nickname: '닉네임 확인에 실패했습니다. 다시 시도해주세요.' };
    }

    try {
      const data = await register(formEmail, trimmedPassword, formNickname);
      setUser(data.user);
      resetRegisterForm();
      router.push(redirectPath);
      return {};
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      return mapAuthApiError(message);
    }
  }

  const [errors, formAction, isPending] = useActionState(submitRegister, {});

  const emailError =
    errors.email ??
    (email.trim() && !isValidEmailShape(email.trim())
      ? '올바른 이메일을 입력해주세요.'
      : undefined) ??
    (emailStatus === 'taken' ? '이미 사용 중인 이메일입니다.' : undefined) ??
    (emailStatus === 'error' ? '이메일 확인에 실패했습니다.' : undefined);

  const emailHint =
    email.trim() && emailStatus === 'checking' ? '확인 중…' : undefined;

  const emailSuccess =
    emailStatus === 'available' ? '사용 가능한 이메일입니다.' : undefined;

  const nicknameError =
    errors.nickname ??
    (nicknameStatus === 'taken' ? '이미 사용 중인 닉네임입니다.' : undefined) ??
    (nicknameStatus === 'error' ? '닉네임 확인에 실패했습니다.' : undefined);

  const nicknameHint =
    nickname.trim() && nicknameStatus === 'checking' ? '확인 중…' : undefined;

  const nicknameSuccess =
    nicknameStatus === 'available' ? '사용 가능한 닉네임입니다.' : undefined;

  const passwordError =
    errors.password ??
    (password.length > 0 ? getPasswordRuleError(password) : undefined);

  const passwordConfirmError =
    errors.passwordConfirm ??
    (passwordConfirm.length > 0 &&
    isPasswordValid(password) &&
    password !== passwordConfirm
      ? '비밀번호가 일치하지 않아요.'
      : undefined);

  return (
    <main className={authPageClassName}>
      <header className="mb-8">
        <h1 className={`${authTitleClassName} text-center`}>회원가입</h1>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <PillEmailInput
          local={emailLocal}
          onLocalChange={setEmailLocal}
          domain={emailDomain}
          onDomainChange={setEmailDomain}
          customDomain={emailCustomDomain}
          onCustomDomainChange={setEmailCustomDomain}
          hint={emailHint}
          success={emailSuccess}
          error={emailError}
        />
        <PillInput
          label="닉네임"
          value={nickname}
          onChange={setNickname}
          name="nickname"
          type="text"
          autoComplete="nickname"
          required
          icon={User}
          hint={nicknameHint}
          success={nicknameSuccess}
          error={nicknameError}
        />
        <div>
          <PillInput
            label="비밀번호"
            value={password}
            onChange={setPassword}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            icon={Lock}
            showPasswordToggle
            error={passwordError}
          />
          <p className={fieldHintClassName}>{PASSWORD_HINT}</p>
        </div>
        <PillInput
          label="비밀번호 확인"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          icon={Lock}
          showPasswordToggle
          error={passwordConfirmError}
        />
        {errors.form ? (
          <p className={fieldErrorClassName} role="alert" aria-live="polite">
            {errors.form}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className={`${authSubmitClassName} mt-2`}>
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {isPending ? '가입 중…' : '회원가입'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        이미 계정이 있으신가요?{' '}
        <Link href={buildLoginHref(redirectPath)} className={authLinkClassName}>
          로그인
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className={authPageClassName}>
          <p className="text-center text-sm text-neutral-500">불러오는 중…</p>
        </main>
      }>
      <RegisterForm />
    </Suspense>
  );
}
