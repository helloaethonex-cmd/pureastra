"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { fieldControlClasses } from "./Field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, className = "", children, ...props },
  ref
) {
  return (
    <select ref={ref} className={`${fieldControlClasses(error)} ${className}`} {...props}>
      {children}
    </select>
  );
});
