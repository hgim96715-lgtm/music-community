/** finalize 후 User.nickname = `탈퇴` + stamp8 (hex) */

const WITHDRAWN_NICKNAME_RE = /^탈퇴[a-f0-9]{8}$/i;

export const WITHDRAWN_AUTHOR_LABEL = '탈퇴한 사용자';

export function isWithdrawnAuthorNickname(nickname: string): boolean {
  return (
    WITHDRAWN_NICKNAME_RE.test(nickname) || nickname === WITHDRAWN_AUTHOR_LABEL
  );
}

/** 피드·댓글·방 메시지 등 작성자 닉 표시용 (이미 라벨이면 그대로) */
export function displayAuthorNickname(nickname: string): string {
  if (isWithdrawnAuthorNickname(nickname)) return WITHDRAWN_AUTHOR_LABEL;
  return nickname;
}
