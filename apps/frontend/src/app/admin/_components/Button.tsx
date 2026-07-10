"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)] focus-visible:outline-[var(--admin-accent)]",
  secondary:
    "bg-[var(--admin-panel-bg)] text-[var(--admin-primary)] hover:bg-[var(--admin-border)] focus-visible:outline-[var(--admin-accent)]",
  ghost:
    "bg-transparent text-[var(--admin-ink-secondary)] hover:bg-[var(--admin-surface-alt)] focus-visible:outline-[var(--admin-accent)]",
  danger:
    "bg-[var(--admin-error-fg)] text-white hover:brightness-90 focus-visible:outline-[var(--admin-error-fg)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[length:var(--admin-text-xs)] gap-1.5",
  md: "h-10 px-4 text-[length:var(--admin-text-sm)] gap-2",
};

/** Every state (default/hover/focus/active/disabled/loading) implemented per §2.7. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[var(--admin-r-md)] font-medium
        transition-colors duration-[var(--admin-duration-occasional)] ease-[var(--admin-ease-in-out-premium)]
        active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none
        outline-offset-2 focus-visible:outline focus-visible:outline-2
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />}
      {children}
    </button>
  );
});
