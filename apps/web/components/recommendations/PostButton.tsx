'use client';

import { LoginPromptDialog } from '@/components/auth/LoginPromptDialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { brandPillBtn, brandPillBtnGuest } from '@/lib/neobrutal';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const NEW_PATH = '/recommendations/new';

export function PostButton() {
  const { user, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  if (isLoading) return null;

  if (user) {
    return (
      <Link href={NEW_PATH} className={brandPillBtn}>
        <PlusIcon className="h-4 w-4" aria-hidden />
        올리기
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={brandPillBtnGuest}>
        <PlusIcon className="h-4 w-4" aria-hidden />
        올리기
      </button>
      <LoginPromptDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        redirectPath={NEW_PATH}
      />
    </>
  );
}
