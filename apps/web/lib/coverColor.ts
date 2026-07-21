/** 자켓 평균색 → 가사 카드용 어두운 틴트 (흰 글자 대비) */

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toCssRgb(r: number, g: number, b: number) {
  return `rgb(${clampByte(r)} ${clampByte(g)} ${clampByte(b)})`;
}

/** 흰 글자가 읽히도록 어둡게 · 너무 검으면 살짝 들어 올림 */
export function toneForLyricCard(r: number, g: number, b: number): string {
  let dr = r * 0.52;
  let dg = g * 0.52;
  let db = b * 0.52;
  const lum = (0.2126 * dr + 0.7152 * dg + 0.0722 * db) / 255;
  if (lum > 0.42) {
    const t = 0.32 / lum;
    dr *= t;
    dg *= t;
    db *= t;
  }
  if (dr + dg + db < 48) {
    dr += 30;
    dg += 28;
    db += 26;
  }
  return toCssRgb(dr, dg, db);
}

/**
 * 썸네일 URL → 카드 배경색.
 * CORS 실패·로드 실패 시 null (호출측에서 기본색).
 */
export function extractCoverTint(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3]! < 140) continue;
          const pr = data[i]!;
          const pg = data[i + 1]!;
          const pb = data[i + 2]!;
          // 순백·순흑 픽셀은 평균을 흐리게 해서 가중치↓
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          if (max > 245 && min > 230) continue;
          if (max < 12) continue;
          const w = 1 + (max - min) / 255;
          r += pr * w;
          g += pg * w;
          b += pb * w;
          n += w;
        }
        if (n < 1) {
          resolve(null);
          return;
        }
        resolve(toneForLyricCard(r / n, g / n, b / n));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
