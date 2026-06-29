const MAX_EDGE = 480;
const MAX_DATA_URL_CHARS = 200_000;
const ALLOWED_TYPES = ['image/png', 'image/webp', 'image/jpeg'] as const;

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mime: 'image/png' | 'image/jpeg',
  quality?: number,
) {
  return mime === 'image/png'
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', quality);
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error('이미지를 읽을 수 없어요.');
  }
}

/** 포토카드 배경용 — 리사이즈·압축 후 data URL (투명 PNG·WebP 유지) */
export async function fileToBackgroundDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    throw new Error('PNG · WebP · JPEG만 올릴 수 있어요.');
  }

  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const bitmap = await loadBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  let edge = Math.min(MAX_EDGE, longest);
  let dataUrl = '';

  try {
    while (edge >= 160) {
      const scale = edge / longest;
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('이미지 처리에 실패했어요.');
      ctx.drawImage(bitmap, 0, 0, width, height);

      if (keepAlpha) {
        dataUrl = canvasToDataUrl(canvas, 'image/png');
      } else {
        for (const quality of [0.82, 0.65, 0.5]) {
          dataUrl = canvasToDataUrl(canvas, 'image/jpeg', quality);
          if (dataUrl.length <= MAX_DATA_URL_CHARS) break;
        }
      }

      if (dataUrl.length <= MAX_DATA_URL_CHARS) break;
      edge = Math.round(edge * 0.75);
    }
  } finally {
    bitmap.close();
  }

  if (!dataUrl || dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error('이미지가 너무 커요. 더 작은 파일을 올려 주세요.');
  }

  return dataUrl;
}
