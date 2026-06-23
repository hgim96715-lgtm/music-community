'use client';
import { useState } from 'react';
import { deleteRecommendation } from './actions';

type Props = {
  id: string;
  title: string;
};

export default function DeleteRecommendationButton({ id, title }: Props) {
  async function handleDelete() {
    if (
      !confirm(
        `"${title}" 추천 글을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.`,
      )
    ) {
      return;
    }
    try {
      await deleteRecommendation(id);
    } catch {
      alert('추천 글을 삭제하는데 실패했습니다. 다시 시도해주세요.');
    }
  }
  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
      삭제
    </button>
  );
}
