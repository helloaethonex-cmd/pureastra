import { SkeletonCard } from "./Skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  subLine?: string;
  currency?: boolean;
  loading?: boolean;
}

function formatValue(value: string | number, currency?: boolean) {
  if (typeof value === "number") {
    return currency
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
      : new Intl.NumberFormat("en-IN").format(value);
  }
  return value;
}

/** KPI tile. Loading state is a skeleton, never a spinner mid-content, per §2.7. */
export function StatCard({ label, value, subLine, currency, loading }: StatCardProps) {
  if (loading) return <SkeletonCard />;

  return (
    <div className="rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 shadow-[var(--admin-elev-1)] sm:p-6">
      <p className="text-[length:var(--admin-text-sm)] font-medium text-[var(--admin-ink-muted)]">{label}</p>
      <p className="mt-1 text-[length:var(--admin-text-2xl)] font-semibold text-[var(--admin-ink)]">
        {formatValue(value, currency)}
      </p>
      {subLine && <p className="mt-1 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">{subLine}</p>}
    </div>
  );
}
