"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className = "", ...props },
  ref
) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-[length:var(--admin-text-sm)] text-[var(--admin-ink-secondary)]">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={`h-4 w-4 rounded-[4px] border-[var(--admin-border)] text-[var(--admin-accent)]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {label}
    </label>
  );
});
