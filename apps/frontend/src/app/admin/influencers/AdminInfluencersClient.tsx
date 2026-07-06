"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
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
      <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">
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

  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[#819744] hover:text-[#5E2B16] mb-8 transition text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Admin
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#7B8BB8] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">
            Influencer Management
          </h1>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="bg-[#EBF1DC] border border-[#819744] text-[#5C6936] rounded-lg px-4 py-3 mb-4 text-sm">
            {message}
          </div>
        ) : null}

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Influencers</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {analytics.data?.influencers.total ?? 0}
            </p>
            <p className="text-xs text-[#6f665b] mt-1">
              Active {analytics.data?.influencers.active ?? 0} | Paused {analytics.data?.influencers.paused ?? 0}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Commission Issued</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {asCurrency(analytics.data?.revenue.totalCommissionIssued ?? 0)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Influenced Revenue</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {asCurrency(analytics.data?.revenue.totalInfluencedOrderValue ?? 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-[#5E2B16] mb-3">Create Influencer</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs text-[#6f665b] mb-1">Name</label>
              <input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-[#6f665b] mb-1">Email</label>
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-[#6f665b] mb-1">Referral Code</label>
              <input
                required
                value={createForm.referralCode}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-[#6f665b] mb-1">Commission %</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={createForm.commissionRate}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={createInfluencer.isPending}
              className="px-4 py-2 rounded-lg bg-[#7B8BB8] text-white hover:bg-[#6979a6] disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Create
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#5E2B16]">Influencers</h2>
              <span className="text-xs text-[#6f665b]">
                {influencers.data?.pagination.total ?? 0} total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedProductSlug}
                onChange={(e) => setSelectedProductSlug(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white w-64"
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
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "PAUSED" | "BANNED");
                }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="BANNED">Banned</option>
              </select>
              <button
                type="button"
                onClick={() => influencers.refetch()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRotate} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F2ECDF] text-[#5E2B16]">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Referral</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Commission</th>
                  <th className="text-left px-4 py-3">Earnings</th>
                  <th className="text-left px-4 py-3">Dashboard</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {influencers.isLoading ? (
                  <tr>
                    <td className="px-4 py-4" colSpan={7}>Loading influencers...</td>
                  </tr>
                ) : influencers.data?.data.length ? (
                  influencers.data.data.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#5E2B16]">{item.name}</p>
                        <p className="text-xs text-[#6f665b]">{item.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{item.referralCode}</td>
                      <td className="px-4 py-3">{item.status}</td>
                      <td className="px-4 py-3">{Number(item.commissionRate).toFixed(2)}%</td>
                      <td className="px-4 py-3">{asCurrency(item.totalEarnings)}</td>
                      <td className="px-4 py-3">{item.canViewDashboard ? "Enabled" : "Disabled"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(item.id, "ACTIVE")}
                            className="px-2 py-1 rounded bg-[#DCE9D8] text-[#2E7D32] text-xs"
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(item.id, "PAUSED")}
                            className="px-2 py-1 rounded bg-[#FFF1D6] text-[#9A5F2D] text-xs"
                          >
                            Pause
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(item.id, "BANNED")}
                            className="px-2 py-1 rounded bg-[#FDE8E8] text-[#B42318] text-xs"
                          >
                            Ban
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommissionUpdate(item.id)}
                            className="px-2 py-1 rounded bg-[#E8F0FA] text-[#16589C] text-xs"
                          >
                            Edit %
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDashboardAccessToggle(item.id, item.canViewDashboard)
                            }
                            className="px-2 py-1 rounded bg-[#ECECEC] text-[#474747] text-xs"
                          >
                            Toggle Access
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInfluencerId(item.id)}
                            className="px-2 py-1 rounded bg-[#7B8BB8] text-white text-xs inline-flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon={faMoneyBillTransfer} />
                            Payouts
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyReferralLink(item.referralCode)}
                            className="px-2 py-1 rounded bg-[#E8F0FA] text-[#16589C] text-xs"
                          >
                            Copy Referral Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyProductLink(item.referralCode)}
                            className="px-2 py-1 rounded bg-[#E8F0FA] text-[#16589C] text-xs"
                          >
                            Copy Product Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4" colSpan={7}>No influencers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {influencers.data ? (
            <div className="px-4 py-3 border-t border-gray-100 text-sm flex items-center justify-between">
              <span>
                Page {influencers.data.pagination.page} of {Math.max(influencers.data.pagination.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={influencers.data.pagination.page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.max(influencers.data.pagination.totalPages, 1), p + 1),
                    )
                  }
                  disabled={
                    influencers.data.pagination.totalPages === 0 ||
                    influencers.data.pagination.page >= influencers.data.pagination.totalPages
                  }
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-[#5E2B16] mb-1">Payout Workflows</h2>
          <p className="text-sm text-[#6f665b] mb-4">
            {selectedInfluencer
              ? `Managing payouts for ${selectedInfluencer.name}`
              : "Select an influencer from the list to manage payouts."}
          </p>

          {selectedInfluencer ? (
            <>
              <form onSubmit={handleRecordPayout} className="grid md:grid-cols-4 gap-3 items-end mb-4">
                <div>
                  <label className="block text-xs text-[#6f665b] mb-1">Amount</label>
                  <input
                    required
                    min={0.01}
                    step="0.01"
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#6f665b] mb-1">Reference Note</label>
                  <input
                    value={payoutForm.referenceNote}
                    onChange={(e) =>
                      setPayoutForm((prev) => ({ ...prev, referenceNote: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recordPayout.isPending}
                  className="px-4 py-2 rounded-lg bg-[#5B8D7C] text-white hover:bg-[#4a7466] disabled:opacity-50"
                >
                  Record Payout
                </button>
              </form>

              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#F2ECDF] text-[#5E2B16]">
                    <tr>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Reference</th>
                      <th className="text-left px-4 py-3">Created</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.isLoading ? (
                      <tr>
                        <td className="px-4 py-4" colSpan={5}>Loading payouts...</td>
                      </tr>
                    ) : payouts.data?.data.length ? (
                      payouts.data.data.map((payout) => (
                        <tr key={payout.id} className="border-t border-gray-100">
                          <td className="px-4 py-3">{asCurrency(payout.amount)}</td>
                          <td className="px-4 py-3">{payout.status}</td>
                          <td className="px-4 py-3">{payout.referenceNote || "-"}</td>
                          <td className="px-4 py-3">{new Date(payout.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {payout.status === "INITIATED" ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePayoutStatusUpdate(payout.id, "COMPLETED")
                                  }
                                  className="px-2 py-1 rounded bg-[#DCE9D8] text-[#2E7D32] text-xs"
                                >
                                  Complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePayoutStatusUpdate(payout.id, "FAILED")}
                                  className="px-2 py-1 rounded bg-[#FDE8E8] text-[#B42318] text-xs"
                                >
                                  Fail
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#6f665b]">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-4" colSpan={5}>No payouts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
