"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { fieldControlClasses } from "./Field";

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { error, className = "", ...props },
  ref
) {
  return <input ref={ref} type="number" className={`${fieldControlClasses(error)} ${className}`} {...props} />;
});
