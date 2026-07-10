"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldControlClasses } from "./Field";

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { error, className = "", ...props },
  ref
) {
  return <input ref={ref} type="date" className={`${fieldControlClasses(error)} ${className}`} {...props} />;
});
