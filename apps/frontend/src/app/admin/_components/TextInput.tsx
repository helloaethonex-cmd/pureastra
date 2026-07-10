"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldControlClasses } from "./Field";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { error, className = "", ...props },
  ref
) {
  return <input ref={ref} className={`${fieldControlClasses(error)} ${className}`} {...props} />;
});
