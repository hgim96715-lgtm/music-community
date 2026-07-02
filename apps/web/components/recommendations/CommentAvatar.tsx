import { User } from 'lucide-react';

type CommentAvatarProps = {
  nickname: string;
  imageUrl?: string | null;
};

export function CommentAvatar({ nickname, imageUrl }: CommentAvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${nickname} 프로필`}
        className="size-8 shrink-0 rounded-full border-2 border-brand-border/20 object-cover shadow-[2px_2px_0_var(--color-brand-shadow-soft)]"
      />
    );
  }

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-border/25 bg-brand-primary-soft text-brand-primary shadow-[2px_2px_0_var(--color-brand-shadow-soft)]"
      aria-hidden>
      <User className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}
