import { AlbumPublicStamp } from './AlbumPublicStamp';

export function AlbumVisibilityToggle({
  value = 'private',
  onChange,
}: {
  value: 'private' | 'public';
  onChange: (next: 'private' | 'public') => void;
}) {
  const isPublic = value === 'public';
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.35)] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-sm text-[#e8dcc8]">LP 책장 · Top3</p>
        <p className="mt-0.5 text-[12px] text-[#cbbba0]">
          {isPublic ? '다른 사람이 프로필에서 볼 수 있어요' : '나만 보는 책장'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {isPublic ? <AlbumPublicStamp /> : null}
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label="LP 책장 공개"
          onClick={() => onChange(isPublic ? 'private' : 'public')}
          className={`relative h-6 w-10 rounded-full transition-colors ${
            isPublic ? 'bg-brand-primary' : 'bg-[rgb(201_166_107/0.25)]'
          }`}>
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[#f3ebe0] transition-transform ${
              isPublic ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
