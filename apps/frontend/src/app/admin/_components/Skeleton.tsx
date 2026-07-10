import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/** Base shimmer block. Shimmer is suppressed under prefers-reduced-motion via admin-tokens.css. */
export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`rounded-[var(--admin-r-sm)] bg-[var(--admin-border)] ${className}`}
      style={{ animation: "admin-shimmer 1.6s ease-in-out infinite", ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-4 w-full ${className}`} />;
}

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-24 w-full ${className}`} />;
}

export function SkeletonTableRow({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className="h-3" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4 space-y-3 ${className}`}
    >
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-7 w-1/2" />
    </div>
  );
}
