export const EMAIL_DOMAIN_PRESETS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'icloud.com',
  'kakao.com',
] as const;

export const EMAIL_DOMAIN_CUSTOM = '__custom__';

export function buildEmail(
  local: string,
  domain: string,
  customDomain: string,
): string {
  const localTrim = local.trim();
  const domainTrim = (
    domain === EMAIL_DOMAIN_CUSTOM ? customDomain : domain
  ).trim();
  if (!localTrim || !domainTrim) return '';
  if (localTrim.includes('@')) return '';
  return `${localTrim}@${domainTrim}`;
}

/** 영문·숫자 이메일 — ㅇㅇㅇㅇ.채 · @df 같은 입력 거부 */
export function isValidEmailShape(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
    email,
  );
}
