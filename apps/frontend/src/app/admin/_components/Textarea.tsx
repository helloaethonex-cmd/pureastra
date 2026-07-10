"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { fieldControlClasses } from "./Field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = "", rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${fieldControlClasses(error)} h-auto py-2 resize-y ${className}`}
      {...props}
    />
  );
});
