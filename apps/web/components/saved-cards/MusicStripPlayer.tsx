import { Play, SkipBack, SkipForward } from 'lucide-react';

type MusicStripControlsProps = {
  compact?: boolean;
  comfortable?: boolean;
};

/** 장식용 — 실제 재생 없음 */
export function MusicStripControls({
  compact = false,
  comfortable = false,
}: MusicStripControlsProps) {
  const icon = comfortable ? 'size-4' : compact ? 'size-3' : 'size-3.5';
  const playSize = comfortable ? 'size-9' : compact ? 'size-7' : 'size-8';
  const playIcon = comfortable ? 'size-4' : compact ? 'size-3' : 'size-3.5';

  return (
    <div
      className={`flex items-center justify-center gap-3 ${
        comfortable ? 'mt-3' : compact ? 'mt-2' : 'mt-2.5'
      }`}
      aria-hidden>
      <span
        className={`inline-flex items-center justify-center text-white/55 ${icon}`}>
        <SkipBack className="size-full" strokeWidth={2.25} />
      </span>
      <span
        className={`inline-flex ${playSize} items-center justify-center rounded-full bg-white text-brand-primary shadow-sm`}>
        <Play className={`${playIcon} fill-current`} strokeWidth={0} />
      </span>
      <span
        className={`inline-flex items-center justify-center text-white/55 ${icon}`}>
        <SkipForward className="size-full" strokeWidth={2.25} />
      </span>
    </div>
  );
}

type MusicStripProgressProps = {
  compact?: boolean;
  comfortable?: boolean;
  onDark?: boolean;
  accentColor?: string;
};

export function MusicStripProgress({
  compact = false,
  comfortable = false,
  onDark = true,
  accentColor = '#ffffff',
}: MusicStripProgressProps) {
  const barHeight = comfortable ? 'h-1.5' : compact ? 'h-0.5' : 'h-1';

  return (
    <div className={comfortable ? 'mt-3' : compact ? 'mt-2' : 'mt-2.5'} aria-hidden>
      <div
        className={`mb-1 flex justify-between font-medium tabular-nums ${
          onDark ? 'text-white/50' : 'text-brand-primary/45'
        } ${
          comfortable ? 'text-[10px]' : compact ? 'text-[7px]' : 'text-[8px]'
        }`}>
        <span>0:00</span>
        <span>-3:45</span>
      </div>
      <div
        className={`overflow-hidden rounded-full ${
          onDark ? 'bg-white/20' : 'bg-brand-primary/12'
        } ${barHeight}`}>
        <div
          className={`rounded-full ${barHeight}`}
          style={{
            width: '38%',
            backgroundColor: accentColor,
          }}
        />
      </div>
    </div>
  );
}
