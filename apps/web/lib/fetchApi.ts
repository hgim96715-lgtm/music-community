export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다. 확인해주세요!',
    );
  }
  return url.replace(/\/$/, '');
}
