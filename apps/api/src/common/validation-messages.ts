import { ValidationError } from 'class-validator';
/** property + constraint 조합 (가장 구체적) */
const FIELD_MESSAGES: Record<string, Partial<Record<string, string>>> = {
  email: {
    isEmail: '올바른 이메일을 입력해주세요.',
  },
  password: {
    minLength: '비밀번호는 8자 이상이어야 합니다.',
    matches:
      '비밀번호는 8자 이상, 영문, 특수문자(!@#$%^&* 등)를 포함해야 합니다.',
  },
  nickname: {
    isNotEmpty: '닉네임을 입력해주세요.',
  },
  title: {
    isNotEmpty: '제목을 입력해주세요.',
  },
  artist: {
    isNotEmpty: '아티스트를 입력해주세요.',
  },
  embedUrl: {
    isUrl: 'http(s):// 를 포함한 전체 주소를 입력해주세요.',
    isNotEmpty: '재생 URL을 입력해주세요.',
  },
  reason: {
    isNotEmpty: '추천 이유를 입력해주세요.',
    maxLength: '추천 이유는 200자 이하여야 합니다.',
  },
  moods: {
    arrayMinSize: '분위기를 1개 이상 선택해주세요.',
    arrayMaxSize: '분위기는 최대 3개까지 선택할 수 있어요.',
    isIn: '올바른 분위기를 선택해주세요.',
  },
  fromEmail: {
    isEmail: '올바른 회신 이메일을 입력해주세요.',
  },
  subject: {
    isNotEmpty: '제목을 입력해주세요.',
    minLength: '제목을 입력해주세요.',
    maxLength: '제목은 120자 이하여야 합니다.',
  },
  body: {
    isNotEmpty: '문의 내용을 입력해주세요.',
    minLength: '문의 내용을 입력해주세요.',
    maxLength: '문의 내용은 2000자 이하여야 합니다.',
  },
};

/** 필드 공통 fallback */

const CONSTRAINT_MESSAGES: Record<string, string> = {
  isEmail: '올바른 이메일을 입력해주세요.',
  isNotEmpty: '필수 항목입니다.',
  isString: '문자열로 입력해주세요.',
  minLength: '입력 길이가 부족합니다.',
  maxLength: '입력 길이가 초과되었습니다.',
  isUrl: 'http(s):// 를 포함한 전체 주소를 입력해주세요.',
  isArray: '배열 형식이 올바르지 않습니다.',
  arrayMinSize: '선택 개수가 부족합니다.',
  arrayMaxSize: '선택 개수가 초과되었습니다.',
  isIn: '허용되지 않은 값입니다.',
  matches: '형식이 올바르지 않습니다.',
  isInt: '정수로 입력해주세요.',
  isUUID: '올바른 ID 형식이 아닙니다.',
  isEnum: '허용되지 않은 값입니다.',
  min: '최소값보다 작습니다.',
  whitelistValidation: '허용되지 않은 필드가 포함되어 있습니다.',
};

export function getValidationMessage(
  property: string,
  constraint: string,
): string {
  return (
    FIELD_MESSAGES[property]?.[constraint] ??
    CONSTRAINT_MESSAGES[constraint] ??
    '입력값을 확인해주세요.'
  );
}

function collectValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      for (const key of Object.keys(error.constraints)) {
        messages.push(getValidationMessage(error.property, key));
      }
    }
    if (error.children?.length) {
      messages.push(...collectValidationMessages(error.children));
    }
  }
  return messages;
}

export function formatValidationMessages(errors: ValidationError[]): string[] {
  return collectValidationMessages(errors);
}
