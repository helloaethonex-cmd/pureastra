"use client";

import { useMemo, useState } from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faSort, faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SkeletonTableRow } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyIcon: IconDefinition;
  emptyHeading: string;
  emptyMessage: string;
  rowActions?: (row: T) => React.ReactNode;
  pagination?: PaginationProps;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyIcon,
  emptyHeading,
  emptyMessage,
  rowActions,
  pagination,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-6 py-12 text-center">
        <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)]">
      <table className="w-full text-left text-[length:var(--admin-text-sm)]">
        <thead className="bg-[var(--admin-surface-alt)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                aria-sort={
                  col.sortValue
                    ? sort?.key === col.key
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                    : undefined
                }
                className={`px-4 py-3 text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-muted)] ${col.className ?? ""}`}
              >
                {col.sortValue ? (
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-[var(--admin-ink)]"
                  >
                    {col.header}
                    <FontAwesomeIcon
                      icon={sort?.key === col.key ? (sort.dir === "asc" ? faSortUp : faSortDown) : faSort}
                      className="text-[10px]"
                    />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {rowActions && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns.length + (rowActions ? 1 : 0)} />
            ))
          ) : sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-4 py-8">
                <EmptyState icon={emptyIcon} heading={emptyHeading} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            sortedRows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors duration-[var(--admin-duration-frequent)] hover:bg-[var(--admin-surface-alt)]">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && <td className="px-4 py-3 text-right">{rowActions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && !loading && sortedRows.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-3">
          <span className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
            Page {pagination.page} of {pagination.pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
