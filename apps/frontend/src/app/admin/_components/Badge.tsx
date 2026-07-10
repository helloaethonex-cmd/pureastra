export type BadgeRole = "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  role: BadgeRole;
  children: React.ReactNode;
  className?: string;
}

const roleClasses: Record<BadgeRole, string> = {
  success: "bg-[var(--admin-success-bg)] text-[var(--admin-success-fg)]",
  warning: "bg-[var(--admin-warning-bg)] text-[var(--admin-warning-fg)]",
  error: "bg-[var(--admin-error-bg)] text-[var(--admin-error-fg)]",
  info: "bg-[var(--admin-info-bg)] text-[var(--admin-info-fg)]",
  neutral: "bg-[var(--admin-disabled-bg)] text-[var(--admin-disabled-fg)]",
};

/** Status pill. Static — no pulsing/breathing motion, per §2.8 absolute bans. */
export function Badge({ role, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--admin-r-sm)] px-2 py-0.5 text-[length:var(--admin-text-2xs)] font-medium leading-5 ${roleClasses[role]} ${className}`}
    >
      {children}
    </span>
  );
}
