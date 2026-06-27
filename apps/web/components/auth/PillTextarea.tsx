'use client';

import { useId } from 'react';
import {
  fieldErrorClassName,
  fieldHintClassName,
  pillTextareaClassName,
  pillInputErrorClassName,
} from '@/lib/form';

type PillTextareaProps = {
  label: string;
  name: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  hint?: string;
  error?: string;
};

export function PillTextarea({
  label,
  name,
  required,
  maxLength,
  rows = 4,
  hint,
  error,
}: PillTextareaProps) {
  const id = useId();
  const feedbackId = useId();
  const hasFeedback = Boolean(error || hint);

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        maxLength={maxLength}
        rows={rows}
        placeholder={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasFeedback ? feedbackId : undefined}
        className={`${pillTextareaClassName} ${error ? pillInputErrorClassName : ''}`}
      />
      {error ? (
        <p
          id={feedbackId}
          className={fieldErrorClassName}
          role="alert"
          aria-live="polite">
          {error}
        </p>
      ) : hint ? (
        <p id={feedbackId} className={fieldHintClassName}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
