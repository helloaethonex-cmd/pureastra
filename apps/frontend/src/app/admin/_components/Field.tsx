interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, help, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[length:var(--admin-text-sm)] font-medium text-[var(--admin-ink-secondary)]"
      >
        {label}
        {required && <span className="text-[var(--admin-error-fg)]"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[length:var(--admin-text-xs)] text-[var(--admin-error-fg)]">{error}</p>
      ) : help ? (
        <p className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">{help}</p>
      ) : null}
    </div>
  );
}

/** Shared base classes for every form control — default/focus/disabled/error states. */
export function fieldControlClasses(hasError?: boolean) {
  return `h-10 w-full rounded-[var(--admin-r-sm)] border bg-[var(--admin-card-bg)] px-3 text-[length:var(--admin-text-sm)]
    text-[var(--admin-ink)] transition-colors duration-[var(--admin-duration-occasional)]
    placeholder:text-[var(--admin-ink-muted)]
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--admin-accent)] focus-visible:outline-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError ? "border-[var(--admin-error-fg)]" : "border-[var(--admin-border)] hover:border-[var(--admin-border-strong)]"}`;
}
