type AlbumPublicStampProps = {
  className?: string;
};

/** LP Bar 입장권 스텁 — 크림지 · 점선 절취 · 「공개」잉크 도장 */
export function AlbumPublicStamp({ className = '' }: AlbumPublicStampProps) {
  return (
    <span
      role="img"
      aria-label="앨범 공개"
      className={`inline-flex -rotate-[7deg] items-stretch shadow-[2px_2px_0_var(--color-brand-shadow-soft)] ${className}`}>
      {/* stub */}
      <span className="flex items-center rounded-l-[3px] border-2 border-r-0 border-[color:var(--color-brand-border)] bg-[color:var(--color-lp-paper)] px-1.5 py-1">
        <span
          className="text-[9px] font-bold tracking-[0.14em] text-[color:var(--color-lp-ink)]"
          style={{ fontFamily: 'var(--font-napkin-hand, cursive)' }}>
          LP
        </span>
      </span>
      {/* 절취선 */}
      <span
        aria-hidden
        className="w-0 border-y-2 border-[color:var(--color-brand-border)] border-l border-dashed border-l-[rgb(31_26_22/0.35)] bg-[color:var(--color-lp-paper)]"
      />
      {/* main */}
      <span className="flex items-center gap-1 rounded-r-[3px] border-2 border-l-0 border-[color:var(--color-brand-border)] bg-[color:var(--color-lp-paper)] px-1.5 py-1">
        <span
          className="-rotate-[5deg] rounded-[2px] border border-[rgb(160_55_45/0.8)] px-1 py-0.5 text-[9px] font-bold leading-none tracking-wider text-[rgb(160_55_45)]"
          style={{ fontFamily: 'var(--font-napkin-hand, cursive)' }}>
          공개
        </span>
      </span>
    </span>
  );
}
