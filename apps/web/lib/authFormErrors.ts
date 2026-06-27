/** 로그인·회원가입 — 필드별 에러 (input 아래 표시) */

export type AuthFieldErrors = {
  email?: string;
  nickname?: string;
  password?: string;
  /** 특정 필드가 아닌 경우 (로그인 실패 등) — 마지막 입력 아래·제출 버튼 위 */
  form?: string;
};

export function emptyAuthFieldErrors(): AuthFieldErrors {
  return {};
}

/** API·검증 메시지 → 해당 필드로 라우팅 */
export function mapAuthApiError(message: string): AuthFieldErrors {
  const lower = message.toLowerCase();

  if (
    lower.includes('email must be an email') ||
    message.includes('올바른 이메일')
  ) {
    return {
      email: message.includes('올바른')
        ? message
        : '올바른 이메일을 입력해주세요.',
    };
  }

  if (message.includes('이미 사용 중인 이메일')) {
    return { email: message };
  }

  if (message.includes('이미 사용 중인 닉네임')) {
    return { nickname: message };
  }

  if (
    lower.includes('password') &&
    (lower.includes('longer') || lower.includes('minlength'))
  ) {
    return { password: '비밀번호는 8자 이상이어야 합니다.' };
  }

  if (message.includes('이메일 또는 비밀번호')) {
    return { form: message };
  }

  return { form: message };
}

export function validateLoginFields(
  email: string,
  password: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!email) errors.email = '이메일을 입력해주세요.';
  if (!password) errors.password = '비밀번호를 입력해주세요.';
  return errors;
}

export function validateRegisterFields(
  email: string,
  password: string,
  nickname: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (!email) errors.email = '이메일을 입력해주세요.';
  if (!nickname) errors.nickname = '닉네임을 입력해주세요.';
  if (!password) errors.password = '비밀번호를 입력해주세요.';
  return errors;
}

export function hasAuthFieldErrors(errors: AuthFieldErrors): boolean {
  return Boolean(errors.email || errors.nickname || errors.password || errors.form);
}
