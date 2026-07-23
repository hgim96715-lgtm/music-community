/** 피드 카드 사이 — LP Bar 톤 · 실선 + ♪ (과한 장식 ❌) */
export function FeedNoteDivider() {
  return (
    <div
      className="flex items-center gap-3 py-1"
      aria-hidden>
      <span className="h-px flex-1 bg-[rgb(201_166_107/0.22)]" />
      <span className="flex items-center gap-1.5 font-serif text-[0.6875rem] leading-none tracking-[0.2em] text-[rgb(201_166_107/0.45)]">
        <span>♪</span>
        <span className="text-[0.625rem] opacity-80">♫</span>
        <span>♪</span>
      </span>
      <span className="h-px flex-1 bg-[rgb(201_166_107/0.22)]" />
    </div>
  );
}
