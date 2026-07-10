"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faMoneyBillTransfer,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import {
  useAdminInfluencerAnalytics,
  useAdminInfluencerPayouts,
  useAdminInfluencers,
  useCreateAdminInfluencer,
  useIsAdmin,
  useRecordAdminInfluencerPayout,
  useUpdateAdminInfluencerCommission,
  useUpdateAdminInfluencerDashboardAccess,
  useUpdateAdminInfluencerPayoutStatus,
  useUpdateAdminInfluencerStatus,
} from "@/hooks/useAdmin";
import { useProducts } from "@/hooks/useProducts";
import type { AdminInfluencer, AdminInfluencerPayout } from "@/services/api";
import { Badge, Button, DataTable, Field, PageHeader, Select, StatCard, TextInput } from "../_components";
import type { DataTableColumn } from "../_components";

const asCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function AdminInfluencersPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "BANNED">("ALL");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    referralCode: "",
    commissionRate: "10",
  });

  const [payoutForm, setPayoutForm] = useState({ amount: "", referenceNote: "" });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const influencers = useAdminInfluencers({
    page,
    limit: 20,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    sortOrder: "desc",
  });
  const analytics = useAdminInfluencerAnalytics({ topLimit: 5 });
  const products = useProducts({ page: 1, limit: 100, sortOrder: "asc" });

  const createInfluencer = useCreateAdminInfluencer();
  const updateStatus = useUpdateAdminInfluencerStatus();
  const updateCommission = useUpdateAdminInfluencerCommission();
  const updateDashboardAccess = useUpdateAdminInfluencerDashboardAccess();
  const recordPayout = useRecordAdminInfluencerPayout();
  const updatePayoutStatus = useUpdateAdminInfluencerPayoutStatus();

  const payouts = useAdminInfluencerPayouts(selectedInfluencerId, { page: 1, limit: 20 });

  const selectedInfluencer = useMemo(
    () => influencers.data?.data.find((item) => item.id === selectedInfluencerId) ?? null,
    [influencers.data, selectedInfluencerId],
  );

  if (adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-[#5E2B16] animate-pulse">Checking access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    router.replace("/");
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const created = await createInfluencer.mutateAsync({
        name: createForm.name,
        email: createForm.email,
        referralCode: createForm.referralCode,
        commissionRate: Number(createForm.commissionRate),
      });
      setMessage(`Influencer \"${created.name}\" created.`);
      setCreateForm({ name: "", email: "", referralCode: "", commissionRate: "10" });
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to create influencer");
    }
  };

  const handleStatusUpdate = async (
    influencerId: string,
    status: "ACTIVE" | "PAUSED" | "BANNED",
  ) => {
    setError(null);
    setMessage(null);

    try {
      await updateStatus.mutateAsync({ influencerId, status });
      setMessage("Status updated.");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update status");
    }
  };

  const handleCommissionUpdate = async (influencerId: string) => {
    const entered = window.prompt("Enter new commission rate (0-100)");
    if (entered === null) return;

    const value = Number(entered);
    if (Number.isNaN(value)) {
      setError("Invalid commission rate");
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await updateCommission.mutateAsync({ influencerId, commissionRate: value });
      setMessage("Commission rate updated.");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update commission");
    }
  };

  const handleDashboardAccessToggle = async (
    influencerId: string,
    currentValue: boolean,
  ) => {
    setError(null);
    setMessage(null);

    try {
      await updateDashboardAccess.mutateAsync({
        influencerId,
        canViewDashboard: !currentValue,
      });
      setMessage("Dashboard access updated.");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update dashboard access");
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInfluencerId) return;

    setError(null);
    setMessage(null);

    try {
      await recordPayout.mutateAsync({
        influencerId: selectedInfluencerId,
        amount: Number(payoutForm.amount),
        referenceNote: payoutForm.referenceNote || undefined,
      });
      setMessage("Payout recorded.");
      setPayoutForm({ amount: "", referenceNote: "" });
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to record payout");
    }
  };

  const handlePayoutStatusUpdate = async (
    payoutId: string,
    status: "COMPLETED" | "FAILED",
  ) => {
    if (!selectedInfluencerId) return;

    setError(null);
    setMessage(null);

    try {
      await updatePayoutStatus.mutateAsync({
        influencerId: selectedInfluencerId,
        payoutId,
        status,
      });
      setMessage("Payout status updated.");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to update payout status");
    }
  };

  const getAppOrigin = () =>
    typeof window !== "undefined" ? window.location.origin : "https://pureastra.in";

  const copyToClipboard = async (text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard is not available");
    }
    await navigator.clipboard.writeText(text);
  };

  const handleCopyReferralLink = async (referralCode: string) => {
    setError(null);
    setMessage(null);
    try {
      const link = `${getAppOrigin()}/?ref=${encodeURIComponent(referralCode)}`;
      await copyToClipboard(link);
      setMessage("Link copied");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to copy link");
    }
  };

  const handleCopyProductLink = async (referralCode: string) => {
    setError(null);
    setMessage(null);

    const slug = selectedProductSlug.trim();
    if (!slug) {
      setError("Select a product first");
      return;
    }

    try {
      const link = `${getAppOrigin()}/product/${encodeURIComponent(slug)}?ref=${encodeURIComponent(referralCode)}`;
      await copyToClipboard(link);
      setMessage("Link copied");
    } catch (err) {
      setError((err instanceof Error ? err.message : undefined) ?? "Failed to copy product link");
    }
  };

  const influencerColumns: DataTableColumn<AdminInfluencer>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <div>
          <p className="font-medium text-[var(--admin-ink)]">{item.name}</p>
          <p className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">{item.email}</p>
        </div>
      ),
    },
    {
      key: "referral",
      header: "Referral",
      render: (item) => <span className="font-mono text-[length:var(--admin-text-xs)]">{item.referralCode}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge role={item.status === "ACTIVE" ? "success" : item.status === "PAUSED" ? "warning" : "error"}>
          {item.status}
        </Badge>
      ),
    },
    { key: "commission", header: "Commission", render: (item) => `${Number(item.commissionRate).toFixed(2)}%` },
    { key: "earnings", header: "Earnings", render: (item) => asCurrency(item.totalEarnings) },
    { key: "dashboard", header: "Dashboard", render: (item) => (item.canViewDashboard ? "Enabled" : "Disabled") },
  ];

  return (
    <div className="max-w-7xl mx-auto">
        <PageHeader title="Influencer Management" breadcrumb="Admin / Influencers" />

        {error ? (
          <div className="mb-4 rounded-[var(--admin-r-md)] bg-[var(--admin-error-bg)] px-4 py-3 text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-[var(--admin-r-md)] bg-[var(--admin-success-bg)] px-4 py-3 text-[length:var(--admin-text-sm)] text-[var(--admin-success-fg)]">
            {message}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Influencers"
            value={analytics.data?.influencers.total ?? 0}
            subLine={`Active ${analytics.data?.influencers.active ?? 0} | Paused ${analytics.data?.influencers.paused ?? 0}`}
            loading={analytics.isLoading}
          />
          <StatCard
            label="Commission Issued"
            value={Number(analytics.data?.revenue.totalCommissionIssued ?? 0)}
            currency
            loading={analytics.isLoading}
          />
          <StatCard
            label="Influenced Revenue"
            value={Number(analytics.data?.revenue.totalInfluencedOrderValue ?? 0)}
            currency
            loading={analytics.isLoading}
          />
        </div>

        <div className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-3 text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">Create Influencer</h2>
          <form onSubmit={handleCreate} className="grid items-end gap-3 md:grid-cols-5">
            <Field label="Name" htmlFor="inf-name">
              <TextInput
                id="inf-name"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </Field>
            <Field label="Email" htmlFor="inf-email">
              <TextInput
                id="inf-email"
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            <Field label="Referral Code" htmlFor="inf-code">
              <TextInput
                id="inf-code"
                required
                value={createForm.referralCode}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                className="font-mono"
              />
            </Field>
            <Field label="Commission %" htmlFor="inf-commission">
              <TextInput
                id="inf-commission"
                required
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={createForm.commissionRate}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
              />
            </Field>
            <Button type="submit" disabled={createInfluencer.isPending} loading={createInfluencer.isPending}>
              <FontAwesomeIcon icon={faPlus} />
              Create
            </Button>
          </form>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">Influencers</h2>
              <span className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                {influencers.data?.pagination.total ?? 0} total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedProductSlug}
                onChange={(e) => setSelectedProductSlug(e.target.value)}
                className="h-9 w-64 text-[length:var(--admin-text-sm)]"
              >
                <option value="">
                  {products.isLoading ? "Loading products..." : "Select product for product link"}
                </option>
                {(products.data?.data ?? [])
                  .filter((product) => Boolean(product.slug))
                  .map((product) => (
                    <option key={product.id} value={product.slug ?? ""}>
                      {product.name} ({product.slug})
                    </option>
                  ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "PAUSED" | "BANNED");
                }}
                className="h-9 text-[length:var(--admin-text-sm)]"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="BANNED">Banned</option>
              </Select>
              <Button size="sm" variant="secondary" onClick={() => influencers.refetch()}>
                <FontAwesomeIcon icon={faRotate} />
                Refresh
              </Button>
            </div>
          </div>

          <DataTable
            columns={influencerColumns}
            rows={influencers.data?.data ?? []}
            rowKey={(item) => item.id}
            loading={influencers.isLoading}
            emptyIcon={faUsers}
            emptyHeading="No influencers found"
            emptyMessage="Create an influencer above to get started."
            pagination={
              influencers.data
                ? {
                    page: influencers.data.pagination.page,
                    pageCount: Math.max(influencers.data.pagination.totalPages, 1),
                    onPageChange: setPage,
                  }
                : undefined
            }
            rowActions={(item) => (
              <div className="flex flex-wrap justify-end gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(item.id, "ACTIVE")}>
                  Activate
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(item.id, "PAUSED")}>
                  Pause
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(item.id, "BANNED")}>
                  Ban
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleCommissionUpdate(item.id)}>
                  Edit %
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleDashboardAccessToggle(item.id, item.canViewDashboard)}>
                  Toggle Access
                </Button>
                <Button size="sm" onClick={() => setSelectedInfluencerId(item.id)}>
                  <FontAwesomeIcon icon={faMoneyBillTransfer} />
                  Payouts
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleCopyReferralLink(item.referralCode)}>
                  Copy Referral Link
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleCopyProductLink(item.referralCode)}>
                  Copy Product Link
                </Button>
              </div>
            )}
          />
        </div>

        <div className="rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-1 text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">Payout Workflows</h2>
          <p className="mb-4 text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">
            {selectedInfluencer
              ? `Managing payouts for ${selectedInfluencer.name}`
              : "Select an influencer from the list to manage payouts."}
          </p>

          {selectedInfluencer ? (
            <>
              <form onSubmit={handleRecordPayout} className="mb-4 grid items-end gap-3 md:grid-cols-4">
                <Field label="Amount" htmlFor="payout-amount">
                  <TextInput
                    id="payout-amount"
                    required
                    min={0.01}
                    step="0.01"
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Reference Note" htmlFor="payout-ref">
                    <TextInput
                      id="payout-ref"
                      value={payoutForm.referenceNote}
                      onChange={(e) => setPayoutForm((prev) => ({ ...prev, referenceNote: e.target.value }))}
                    />
                  </Field>
                </div>
                <Button type="submit" disabled={recordPayout.isPending} loading={recordPayout.isPending}>
                  Record Payout
                </Button>
              </form>

              <DataTable
                columns={
                  [
                    { key: "amount", header: "Amount", render: (p: AdminInfluencerPayout) => asCurrency(p.amount) },
                    {
                      key: "status",
                      header: "Status",
                      render: (p: AdminInfluencerPayout) => (
                        <Badge role={p.status === "COMPLETED" ? "success" : p.status === "FAILED" ? "error" : "warning"}>
                          {p.status}
                        </Badge>
                      ),
                    },
                    { key: "reference", header: "Reference", render: (p: AdminInfluencerPayout) => p.referenceNote || "-" },
                    {
                      key: "created",
                      header: "Created",
                      render: (p: AdminInfluencerPayout) => new Date(p.createdAt).toLocaleString(),
                    },
                  ] satisfies DataTableColumn<AdminInfluencerPayout>[]
                }
                rows={payouts.data?.data ?? []}
                rowKey={(p) => p.id}
                loading={payouts.isLoading}
                emptyIcon={faMoneyBillTransfer}
                emptyHeading="No payouts found"
                emptyMessage="Record a payout above to see it listed here."
                rowActions={(payout) =>
                  payout.status === "INITIATED" ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handlePayoutStatusUpdate(payout.id, "COMPLETED")}>
                        Complete
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handlePayoutStatusUpdate(payout.id, "FAILED")}>
                        Fail
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">No actions</span>
                  )
                }
              />
            </>
          ) : null}
        </div>
      </div>
  );
}
