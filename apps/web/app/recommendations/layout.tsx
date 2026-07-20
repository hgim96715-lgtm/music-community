import { LpBarShell } from '@/components/recommendations/LpBarShell';

export default function RecommendationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LpBarShell>{children}</LpBarShell>;
}
