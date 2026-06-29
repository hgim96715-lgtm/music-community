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
  /** 없으면 label과 동일 */
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function PillTextarea({
  label,
  name,
  required,
  maxLength,
  rows = 4,
  hint,
  error,
  placeholder,
  value,
  onChange,
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
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder ?? label}
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
