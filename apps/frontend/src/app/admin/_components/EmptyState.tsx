import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface EmptyStateProps {
  icon: IconDefinition;
  heading: string;
  message: string;
  action?: React.ReactNode;
}

/** Teaches the next action instead of a bare "No X found." Rare/first-run: motion may be gentle, never looping. */
export function EmptyState({ icon, heading, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--admin-r-lg)] border border-dashed border-[var(--admin-border)] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-panel-bg)] text-[var(--admin-accent)]">
        <FontAwesomeIcon icon={icon} className="text-lg" />
      </span>
      <h3 className="text-[length:var(--admin-text-base)] font-medium text-[var(--admin-ink)]">{heading}</h3>
      <p className="max-w-sm text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">{message}</p>
      {action}
    </div>
  );
}
