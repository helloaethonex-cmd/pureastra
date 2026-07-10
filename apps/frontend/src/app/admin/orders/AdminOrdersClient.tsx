"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faTags } from "@fortawesome/free-solid-svg-icons";
import {
  useIsAdmin,
  useUpdateAdminOrderStatus,
  useDownloadShippingLabel,
  useDownloadBulkShippingLabels,
} from "@/hooks/useAdmin";
import {
  getAdminOrderInvoice,
  listAdminOrders,
  regenerateAdminInvoicePdf,
  type OrderInvoiceResponse,
} from "@/services/api";
import { Badge, Button, PageHeader, TextInput } from "../_components";
import type { BadgeRole } from "../_components";

const ORDER_STATUS_LABEL: Record<number, string> = {
  0: "PLACED",
  1: "CONFIRMED",
  2: "PACKED",
  3: "SHIPPED",
  4: "DELIVERED",
  5: "CANCELLED",
};

const PAYMENT_STATUS_LABEL: Record<number, string> = {
  0: "PENDING",
  1: "SUCCESS",
  2: "FAILED",
  3: "REFUNDED",
};

const isLabelEligible = (orderStatus: number) => orderStatus <= 2;
const PAGE_SIZE = 20;

const orderStatusBadgeRole = (status: number): BadgeRole => {
  if (status === 4) return "success";
  if (status === 5) return "error";
  return "warning";
};

const paymentStatusBadgeRole = (status: number): BadgeRole => {
  if (status === 1) return "success";
  if (status === 2) return "error";
  if (status === 3) return "info";
  return "warning";
};

const isFakeOrderTimestamp = (createdAt: string) => {
  const dt = new Date(createdAt);
  return (
    dt.getFullYear() === 2026 &&
    dt.getMonth() === 3 &&
    dt.getDate() === 15 &&
    dt.getHours() === 23 &&
    (dt.getMinutes() === 55 || dt.getMinutes() === 56)
  );
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [allOrders, setAllOrders] = useState<
    Array<{
      id: string;
      orderNumber: string;
      userId: string;
      orderStatus: number;
      paymentStatus: number;
      totalPaid: string;
      createdAt: string;
    }>
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoiceResponse | null>(null);
  const [invoiceOrderNumber, setInvoiceOrderNumber] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [regeneratingOrder, setRegeneratingOrder] = useState<string | null>(null);
  const updateStatus = useUpdateAdminOrderStatus();
  const downloadLabel = useDownloadShippingLabel();
  const downloadBulk = useDownloadBulkShippingLabels();

  useEffect(() => {
    let cancelled = false;

    const loadAllOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);

      try {
        const collected: Array<{
          id: string;
          orderNumber: string;
          userId: string;
          orderStatus: number;
          paymentStatus: number;
          totalPaid: string;
          createdAt: string;
        }> = [];

        let currentPage = 1;
        let totalPages = 1;

        while (currentPage <= totalPages) {
          const response = await listAdminOrders({
            page: currentPage,
            limit: 100,
            search: search || undefined,
            sortOrder: "desc",
          });

          totalPages = response.pagination.totalPages;
          collected.push(...response.data);
          currentPage += 1;
        }

        if (cancelled) return;

        setAllOrders(collected.filter((order) => !isFakeOrderTimestamp(order.createdAt)));
      } catch (err) {
        if (cancelled) return;
        setAllOrders([]);
        setOrdersError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    loadAllOrders();

    return () => {
      cancelled = true;
    };
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const filteredOrders = useMemo(
    () => allOrders.slice(pageStart, pageEnd),
    [allOrders, pageStart, pageEnd],
  );

  const validOrderIdSet = useMemo(
    () => new Set(allOrders.map((order) => order.id)),
    [allOrders],
  );
  const effectiveSelectedIds = useMemo(
    () => new Set(Array.from(selectedIds).filter((id) => validOrderIdSet.has(id))),
    [selectedIds, validOrderIdSet],
  );

  if (adminLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center">Checking access...</div>;
  }

  if (!isAdmin) {
    router.replace("/");
    return null;
  }

  const eligibleOrders = filteredOrders.filter((order) => isLabelEligible(order.orderStatus));
  const allEligibleSelected =
    eligibleOrders.length > 0 &&
    eligibleOrders.every((order) => effectiveSelectedIds.has(order.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleOrders.map((order) => order.id)));
    }
  };

  const handleAdvance = (orderNumber: string, currentStatus: number) => {
    const nextStatus = currentStatus + 1;
    if (nextStatus > 4) return;
    updateStatus.mutate({
      orderNumber,
      newStatus: nextStatus,
      note: "Status updated from admin panel",
    });
  };

  const handleSingleLabel = (orderId: string) => {
    downloadLabel.mutate(orderId, {
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to download label"),
    });
  };

  const handleBulkLabel = () => {
    const eligibleIdSet = new Set(eligibleOrders.map((order) => order.id));
    const selectedEligibleIds = Array.from(effectiveSelectedIds).filter((id) =>
      eligibleIdSet.has(id),
    );

    if (selectedEligibleIds.length === 0) {
      toast.error("Select at least one order first");
      return;
    }

    downloadBulk.mutate(selectedEligibleIds, {
      onSuccess: () => setSelectedIds(new Set()),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to download bulk labels"),
    });
  };

  const handleViewInvoice = async (orderNumber: string) => {
    setInvoiceError(null);
    setInvoiceLoading(true);
    setInvoiceOrderNumber(orderNumber);

    try {
      const invoice = await getAdminOrderInvoice(orderNumber);
      setSelectedInvoice(invoice);
    } catch (err) {
      setSelectedInvoice(null);
      setInvoiceError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleRegenerateInvoicePdf = async (orderNumber: string, force = false) => {
    setInvoiceError(null);
    setRegeneratingOrder(orderNumber);

    try {
      await regenerateAdminInvoicePdf(orderNumber, force);
      await handleViewInvoice(orderNumber);
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : "Failed to regenerate PDF");
    } finally {
      setRegeneratingOrder(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
        <PageHeader title="Manage Orders" breadcrumb="Admin / Orders" />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <TextInput
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by order number"
            className="w-full sm:w-80"
          />

          {effectiveSelectedIds.size > 0 ? (
            <Button onClick={handleBulkLabel} disabled={downloadBulk.isPending} loading={downloadBulk.isPending}>
              {!downloadBulk.isPending && <FontAwesomeIcon icon={faTags} />}
              Download Labels ({effectiveSelectedIds.size})
            </Button>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)]">
          <table className="w-full text-[length:var(--admin-text-sm)]">
            <thead className="bg-[var(--admin-surface-alt)] text-[var(--admin-ink)]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleSelectAll}
                    disabled={eligibleOrders.length === 0}
                    title="Select all eligible orders"
                    className="accent-[var(--admin-accent)]"
                  />
                </th>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Order Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Total Paid</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {ordersLoading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={8}>Loading orders...</td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td className="px-4 py-4 text-[var(--admin-error-fg)]" colSpan={8}>{ordersError}</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-4 py-4" colSpan={8}>No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const eligible = isLabelEligible(order.orderStatus);
                  const isSinglePending =
                    downloadLabel.isPending && downloadLabel.variables === order.id;

                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={effectiveSelectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          disabled={!eligible}
                          title={eligible ? "Select for bulk label" : "Not eligible for shipping label"}
                          className="accent-[var(--admin-accent)] disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono">{order.orderNumber}</td>
                      <td className="px-4 py-3">{order.userId}</td>
                      <td className="px-4 py-3">
                        <Badge role={orderStatusBadgeRole(order.orderStatus)}>
                          {ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge role={paymentStatusBadgeRole(order.paymentStatus)}>
                          {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">₹{order.totalPaid}</td>
                      <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAdvance(order.orderNumber, order.orderStatus)}
                            disabled={updateStatus.isPending || order.orderStatus >= 4 || order.orderStatus === 5}
                          >
                            Advance
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleViewInvoice(order.orderNumber)}>
                            Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRegenerateInvoicePdf(order.orderNumber)}
                            disabled={regeneratingOrder === order.orderNumber}
                            loading={regeneratingOrder === order.orderNumber}
                          >
                            {regeneratingOrder === order.orderNumber ? "Regenerating..." : "Regen PDF"}
                          </Button>
                          {eligible ? (
                            <Button
                              size="sm"
                              onClick={() => handleSingleLabel(order.id)}
                              disabled={isSinglePending}
                              loading={isSinglePending}
                              title="Download shipping label PDF"
                            >
                              {!isSinglePending && <FontAwesomeIcon icon={faTag} />}
                              Label
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!ordersLoading && allOrders.length > 0 ? (
          <div className="mt-4 flex items-center justify-between text-[length:var(--admin-text-sm)] text-[var(--admin-ink)]">
            <span>
              Page {safePage} of {totalPages} ({allOrders.length} total)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                Prev
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {(invoiceOrderNumber || invoiceError || selectedInvoice) ? (
          <div className="mt-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">
                Invoice: {invoiceOrderNumber ?? "-"}
              </h2>
              {invoiceOrderNumber ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRegenerateInvoicePdf(invoiceOrderNumber, true)}
                  disabled={regeneratingOrder === invoiceOrderNumber}
                >
                  Force Regenerate
                </Button>
              ) : null}
            </div>

            {invoiceLoading ? <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">Loading invoice...</p> : null}
            {invoiceError ? <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{invoiceError}</p> : null}

            {selectedInvoice ? (
              <div className="grid gap-4 text-[length:var(--admin-text-sm)] md:grid-cols-2">
                <div>
                  <p className="text-[var(--admin-ink-muted)]">Invoice Number</p>
                  <p className="font-medium text-[var(--admin-ink)]">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[var(--admin-ink-muted)]">Issued At</p>
                  <p className="font-medium text-[var(--admin-ink)]">
                    {new Date(selectedInvoice.issuedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--admin-ink-muted)]">Total</p>
                  <p className="font-medium text-[var(--admin-ink)]">₹{selectedInvoice.totalAmount}</p>
                </div>
                <div>
                  <p className="text-[var(--admin-ink-muted)]">PDF Status</p>
                  <p className="font-medium text-[var(--admin-ink)]">{selectedInvoice.pdfStatus}</p>
                </div>
                <div className="md:col-span-2">
                  {selectedInvoice.pdfUrl ? (
                    <a
                      href={selectedInvoice.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-[var(--admin-r-md)] bg-[var(--admin-accent)] px-3 py-1.5 text-white hover:bg-[var(--admin-accent-hover)]"
                    >
                      Open PDF
                    </a>
                  ) : (
                    <p className="text-[var(--admin-ink-muted)]">No PDF URL yet. Use regenerate action.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
  );
}
