'use client';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import { pillTextareaClassName } from '@/lib/form';
import { useEffect, useState } from 'react';

type ReportDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export function ReportDialog({
  open,
  title = '신고할까요?',
  description = '운영 검토용이에요. 허위 신고는 제재될 수 있어요.',
  isPending = false,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setReasonError('');
    }
  }, [open]);

  async function handleConfirm() {
    const trimmed = reason.trim();
    if (trimmed.length < 2) {
      setReasonError('2자 이상 입력해주세요.');
      return;
    }
    setReasonError('');
    try {
      await onSubmit(trimmed);
      setReason('');
    } catch (error) {
      setReasonError(
        error instanceof Error ? error.message : '신고에 실패했습니다.',
      );
    }
  }
  return (
    <FeedDialog
      open={open}
      title={title}
      description={description}
      confirmLabel="신고"
      pendingLabel="신고 중…"
      isPending={isPending}
      onClose={() => {
        if (!isPending) onClose();
      }}
      onConfirm={() => void handleConfirm()}>
      <div className="space-y-1.5">
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError) setReasonError('');
          }}
          placeholder="신고 사유 (필수)"
          rows={3}
          maxLength={500}
          disabled={isPending}
          className={`${pillTextareaClassName} text-left`}
        />
        {reasonError ? (
          <p className="px-1 text-left text-xs text-red-500" role="alert">
            {reasonError}
          </p>
        ) : null}
      </div>
    </FeedDialog>
  );
}
