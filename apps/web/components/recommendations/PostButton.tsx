'use client';

import { LoginPromptDialog } from '@/components/auth/LoginPromptDialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const NEW_PATH = '/recommendations/new';

const primaryClassName =
  'inline-flex items-center gap-1 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white';
const guestClassName =
  'inline-flex items-center gap-1 rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-500';

export function PostButton() {
  const { user, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  if (isLoading) return null;

  if (user) {
    return (
      <Link href={NEW_PATH} className={primaryClassName}>
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
        className={guestClassName}>
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
