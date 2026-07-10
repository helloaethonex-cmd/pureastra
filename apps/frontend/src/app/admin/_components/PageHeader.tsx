interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
      <div>
        {breadcrumb && (
          <p className="text-[length:var(--admin-text-2xs)] uppercase tracking-wide text-[var(--admin-ink-muted)]">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-[length:var(--admin-text-xl)] font-semibold text-[var(--admin-ink)]">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
