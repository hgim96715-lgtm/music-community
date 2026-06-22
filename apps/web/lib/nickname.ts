/**
 * 닉네임 규칙·제안 (profile.md)
 *
 * - 이메일 가입: /register 에서 사용자가 직접 입력
 * - 소셜 가입: 이메일 @ 앞부분을 초기 닉네임으로 (auth.ts jwt callback)
 * - 변경: /profile 마이페이지
 */

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 10;
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

//내가 정한 예약어 목록 더 늘리려면 여기에 추가하면 됨
// 추후 추가할게 많아지면 분리 고려
const RESERVED = new Set(["admin", "official"]);

export type NickNameValidation =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

/** 회원가입·프로필 수정 공통 검증 */

export function validateNickname(raw: string): NickNameValidation {
  const nickname = raw.trim();
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    return {
      ok: false,
      error: `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자 이어야 합니다.`,
    };
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return {
      ok: false,
      error: "한글, 영문, 숫자, _ 만 사용할 수 있습니다.",
    };
  }
  if (RESERVED.has(nickname.toLowerCase())) {
    return { ok: false, error: "사용할수 없는 닉네임입니다." };
  }
  return { ok: true, nickname };
}

/**
 * 소셜 로그인 직후 — OAuth 이메일에서 @ 앞부분 추출
 * 예: learner@example.com → learner
 */

export function suggestNicknameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
  const sanitized = local
    .replace(/[^가-힣a-zA-Z0-9_]/g, "")
    .slice(0, NICKNAME_MAX);

  if (sanitized.length >= NICKNAME_MIN) {
    return sanitized;
  }
  return `user${sanitized}`.slice(0, NICKNAME_MIN);
}

/** 중복 시 숫자 suffix — 전체 길이 NICKNAME_MAX 이하 */
export function withNicknameSuffix(base: string, suffix: number): string {
  const suffixStr = String(suffix);
  const maxBaseLen = NICKNAME_MAX - suffixStr.length;
  const trimmedBase = base.slice(0, Math.max(maxBaseLen, NICKNAME_MIN));
  return `${trimmedBase}${suffixStr}`.slice(0, NICKNAME_MAX);
}
