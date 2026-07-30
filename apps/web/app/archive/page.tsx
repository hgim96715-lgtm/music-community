import { redirect } from 'next/navigation';

/** 예전 분리 아카이브 → 메인 피드 「더 보기」로 통합 */
export default function ArchivePage() {
  redirect('/recommendations');
}
