"use client";

import { useState } from "react";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import "../_components/admin-tokens.css";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DateInput,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  PageHeader,
  Select,
  SkeletonCard,
  StatCard,
  TextInput,
  Textarea,
} from "../_components";
import type { DataTableColumn } from "../_components";

interface DemoRow {
  id: string;
  name: string;
  status: "active" | "paused";
}

const demoRows: DemoRow[] = [
  { id: "1", name: "Vitamin C Serum", status: "active" },
  { id: "2", name: "Niacinamide Toner", status: "paused" },
];

const columns: DataTableColumn<DemoRow>[] = [
  { key: "name", header: "Name", render: (r) => r.name, sortValue: (r) => r.name },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge role={r.status === "active" ? "success" : "warning"}>{r.status}</Badge>,
  },
];

export function KitchenSinkClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tableState, setTableState] = useState<"populated" | "loading" | "empty" | "error">("populated");

  return (
    <div className="admin-root min-h-screen p-8 space-y-10">
      <PageHeader title="Kitchen Sink" breadcrumb="Admin / Dev" actions={<Button size="sm">Primary action</Button>} />

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-3">
          <Badge role="success">Active</Badge>
          <Badge role="warning">Pending</Badge>
          <Badge role="error">Failed</Badge>
          <Badge role="info">Interstate</Badge>
          <Badge role="neutral">Disabled</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">StatCard</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Revenue" value={128400} currency subLine="Last 30 days" />
          <StatCard label="Orders" value={342} />
          <StatCard label="Loading" value={0} loading />
          <SkeletonCard />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">Form primitives</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
          <Field label="Name" htmlFor="ks-name" required>
            <TextInput id="ks-name" placeholder="Product name" />
          </Field>
          <Field label="Stock" htmlFor="ks-stock" help="Units currently available">
            <NumberInput id="ks-stock" placeholder="0" />
          </Field>
          <Field label="Category" htmlFor="ks-cat">
            <Select id="ks-cat">
              <option>Serums</option>
              <option>Toners</option>
            </Select>
          </Field>
          <Field label="Discount ends" htmlFor="ks-date">
            <DateInput id="ks-date" />
          </Field>
          <Field label="Description" htmlFor="ks-desc" error="Description is required">
            <Textarea id="ks-desc" />
          </Field>
          <Checkbox id="ks-active" label="Active" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">EmptyState</h2>
        <EmptyState
          icon={faBoxOpen}
          heading="No products yet"
          message="Create your first product to see it listed here."
          action={<Button size="sm">Create product</Button>}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">DataTable</h2>
        <div className="flex gap-2">
          {(["populated", "loading", "empty", "error"] as const).map((s) => (
            <Button key={s} size="sm" variant={tableState === s ? "primary" : "secondary"} onClick={() => setTableState(s)}>
              {s}
            </Button>
          ))}
        </div>
        <DataTable
          columns={columns}
          rows={tableState === "empty" ? [] : demoRows}
          rowKey={(r) => r.id}
          loading={tableState === "loading"}
          error={tableState === "error" ? "Failed to load products." : undefined}
          onRetry={() => setTableState("populated")}
          emptyIcon={faBoxOpen}
          emptyHeading="No products"
          emptyMessage="Nothing here yet."
          rowActions={() => (
            <button className="text-[var(--admin-error-fg)]" aria-label="Delete">
              <span className="sr-only">Delete</span>
            </button>
          )}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[length:var(--admin-text-lg)] font-semibold">Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm delete">
          <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-secondary)]">
            This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              <span className="inline-flex items-center gap-1">Delete</span>
            </Button>
          </div>
        </Modal>
      </section>
    </div>
  );
}
