import type { LucideIcon } from 'lucide-react';
import { ACTION_BTN, ACTION_ICON, COUNT_SLOT } from '@/lib/feedCardActions';

type ActionCountProps = {
  icon: LucideIcon;
  count: number;
  label: string;
  active?: boolean;
  onClick: () => void;
};

export function ActionCount({
  icon: Icon,
  count,
  label,
  active,
  onClick,
}: ActionCountProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`${ACTION_BTN} ${
        active ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
      }`}>
      <Icon
        className={`${ACTION_ICON} ${active ? 'fill-neutral-700/15' : ''}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className={COUNT_SLOT}>{count}</span>
    </button>
  );
}
