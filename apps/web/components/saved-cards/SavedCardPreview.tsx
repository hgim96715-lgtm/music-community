import type { ApiSavedCardCustomization } from '@/lib/apiTypes';
import { formatFeedDate } from '@/lib/date';
import { getMoodColors } from '@/lib/moodColors';
import {
  getSavedCardPlayerBarColor,
  getSavedCardTextColor,
  PLAYER_BAR_ALPHA,
  withHexAlpha,
} from '@/lib/savedCardColors';
import { resolveSavedCardLayout } from '@/lib/savedCardLayout';
import { savedCardFace, savedCardFaceLg } from '@/lib/neobrutal';
import {
  MusicStripControls,
  MusicStripProgress,
} from './MusicStripPlayer';

export type SavedCardPreviewData = {
  title: string;
  artist: string;
  reason: string;
  moods: string[];
  postedAt: string;
  savedAt?: string;
};

type SavedCardPreviewProps = {
  data: SavedCardPreviewData;
  customization: ApiSavedCardCustomization;
  className?: string;
  size?: 'thumb' | 'strip' | 'default' | 'large' | 'editor';
};

function stripShellClass(size: SavedCardPreviewProps['size']) {
  const base =
    'relative mx-auto flex w-full flex-col overflow-hidden rounded-2xl border border-brand-primary/30 text-left shadow-[2px_2px_0_var(--color-brand-shadow-soft)]';

  switch (size) {
    case 'thumb':
      return `${base} aspect-[9/14]`;
    case 'editor':
      return `${base} aspect-[9/14] w-full max-w-[15rem]`;
    case 'large':
      return `${base} aspect-[9/14] w-full max-w-[12.5rem]`;
    case 'strip':
    case 'default':
    default:
      return `${base} aspect-[9/14] max-w-[10.5rem]`;
  }
}

function PosterSavedCardPreview({
  data,
  customization,
  className,
  size,
}: SavedCardPreviewProps) {
  const display = customization.display;
  const showTitle = display?.title !== false;
  const showArtist = display?.artist !== false;
  const showReason = display?.reason !== false;
  const showMoods = display?.moods !== false;
  const showPostedAt = display?.postedAt === true;
  const showSavedAt = display?.savedAt === true;
  const imageOpacity = customization.backgroundImageOpacity ?? 1;
  const hasBackgroundImage = Boolean(customization.backgroundImage);
  const faceClass = size === 'large' ? savedCardFaceLg : savedCardFace;
  const padding = size === 'thumb' ? 'p-2' : 'p-3';

  return (
    <div
      className={`relative flex aspect-[2/3] flex-col justify-between text-left ${faceClass} ${padding} ${className ?? ''}`}
      style={
        hasBackgroundImage
          ? undefined
          : { backgroundColor: customization.background ?? '#f0e6ff' }
      }>
      {customization.backgroundImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- user data URL preview
        <img
          src={customization.backgroundImage}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover"
          style={{ opacity: imageOpacity }}
        />
      ) : null}

      {hasBackgroundImage ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-transparent to-black/20"
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 min-h-0 flex-1 space-y-1">
        {showTitle ? (
          <p
            className={`truncate font-bold leading-tight ${
              size === 'thumb' ? 'text-[10px]' : 'text-sm'
            }`}
            style={{ color: getSavedCardTextColor(customization, 'title') }}>
            {data.title}
          </p>
        ) : null}
        {showArtist ? (
          <p
            className={`truncate font-medium ${
              size === 'thumb' ? 'text-[9px]' : 'text-xs'
            }`}
            style={{ color: getSavedCardTextColor(customization, 'artist') }}>
            {data.artist}
          </p>
        ) : null}
        {showReason ? (
          <p
            className={`line-clamp-2 leading-relaxed ${
              size === 'thumb' ? 'text-[8px]' : 'text-[11px]'
            }`}
            style={{ color: getSavedCardTextColor(customization, 'reason') }}>
            {data.reason}
          </p>
        ) : null}
        {showMoods && data.moods.length > 0 ? (
          <div className="flex flex-wrap gap-0.5 pt-0.5">
            {data.moods.map((mood) => {
              const colors = getMoodColors(mood);
              return (
                <span
                  key={mood}
                  className={`mood-pill-depth rounded border px-1 py-px font-medium ${
                    size === 'thumb' ? 'text-[7px]' : 'text-[9px]'
                  } ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}>
                  {mood}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {showPostedAt || showSavedAt ? (
        <div
          className={`relative z-10 mt-1.5 space-y-0.5 border-t border-black/8 pt-1.5 ${
            size === 'thumb' ? 'text-[7px]' : 'text-[10px]'
          }`}>
          {showPostedAt ? (
            <p style={{ color: getSavedCardTextColor(customization, 'postedAt') }}>
              올림 {formatFeedDate(data.postedAt)}
            </p>
          ) : null}
          {showSavedAt ? (
            <p style={{ color: getSavedCardTextColor(customization, 'savedAt') }}>
              저장{' '}
              {data.savedAt ? formatFeedDate(data.savedAt) : '저장 시 표시'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MusicStripSavedCardPreview({
  data,
  customization,
  className = '',
  size = 'strip',
}: SavedCardPreviewProps) {
  const display = customization.display;
  const showTitle = display?.title !== false;
  const showArtist = display?.artist !== false;
  const showReason = display?.reason === true;
  const showMoods = display?.moods !== false;
  const showPostedAt = display?.postedAt === true;
  const showSavedAt = display?.savedAt === true;
  const imageOpacity = customization.backgroundImageOpacity ?? 1;
  const hasBackgroundImage = Boolean(customization.backgroundImage);
  const compact = size === 'thumb';
  const comfortable = size === 'editor' || size === 'large';
  const playerBarColor = getSavedCardPlayerBarColor(customization);
  const titleColor = getSavedCardTextColor(customization, 'title');
  const artistColor = getSavedCardTextColor(customization, 'artist');
  const middleBackground = customization.background ?? '#e4eff5';

  return (
    <div className={`${stripShellClass(size)} ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden>
        {hasBackgroundImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- user data URL preview
          <img
            src={customization.backgroundImage}
            alt=""
            className="size-full object-cover"
            style={{ opacity: imageOpacity }}
          />
        ) : (
          <div
            className="size-full"
            style={{ backgroundColor: middleBackground }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <div className="relative min-h-0 flex-[1.35]">
          {showMoods && data.moods.length > 0 ? (
            <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
              {data.moods.map((mood) => {
                const colors = getMoodColors(mood);
                return (
                  <span
                    key={mood}
                  className={`mood-pill-depth rounded-md border px-1.5 py-0.5 font-semibold shadow-sm ${
                    compact
                      ? 'text-[7px]'
                      : comfortable
                        ? 'text-[10px]'
                        : 'text-[8px]'
                  } ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}>
                    {mood}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          className={`relative shrink-0 overflow-hidden rounded-b-2xl border-t border-white/15 backdrop-blur-md backdrop-saturate-125 ${
            comfortable ? 'px-3 pb-3 pt-2.5' : 'px-2.5 pb-2.5 pt-2'
          }`}
          style={{
            backgroundColor: withHexAlpha(playerBarColor, PLAYER_BAR_ALPHA),
          }}>
        {showTitle ? (
          <p
            className={`truncate font-bold leading-tight ${
              compact
                ? 'text-[10px]'
                : comfortable
                  ? 'text-base'
                  : 'text-xs'
            }`}
            style={{ color: titleColor }}>
            {data.title || '제목'}
          </p>
        ) : null}
        {showArtist ? (
          <p
            className={`truncate font-medium ${
              compact
                ? 'text-[8px]'
                : comfortable
                  ? 'text-sm'
                  : 'text-[10px]'
            }`}
            style={{ color: artistColor }}>
            {data.artist || '아티스트'}
          </p>
        ) : null}

        {(showTitle || showArtist) && (
          <>
            <MusicStripProgress
              compact={compact && !comfortable}
              comfortable={comfortable}
              onDark
              accentColor={titleColor}
            />
            <MusicStripControls
              compact={compact && !comfortable}
              comfortable={comfortable}
            />
          </>
        )}

        {showReason ? (
          <p
            className={`mt-2 line-clamp-2 ${
              compact
                ? 'text-[8px]'
                : comfortable
                  ? 'text-xs'
                  : 'text-[9px]'
            }`}
            style={{ color: getSavedCardTextColor(customization, 'reason') }}>
            {data.reason}
          </p>
        ) : null}

        {showPostedAt || showSavedAt ? (
          <div
            className={`mt-2 space-y-0.5 ${
              compact
                ? 'text-[7px]'
                : comfortable
                  ? 'text-[10px]'
                  : 'text-[8px]'
            }`}>
            {showPostedAt ? (
              <p
                style={{
                  color: getSavedCardTextColor(customization, 'postedAt'),
                }}>
                올림 {formatFeedDate(data.postedAt)}
              </p>
            ) : null}
            {showSavedAt ? (
              <p
                style={{
                  color: getSavedCardTextColor(customization, 'savedAt'),
                }}>
                저장{' '}
                {data.savedAt ? formatFeedDate(data.savedAt) : '저장 시 표시'}
              </p>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}

export function SavedCardPreview(props: SavedCardPreviewProps) {
  const layout = resolveSavedCardLayout(props.customization);

  if (layout === 'music-strip') {
    return <MusicStripSavedCardPreview {...props} />;
  }

  return <PosterSavedCardPreview {...props} />;
}
