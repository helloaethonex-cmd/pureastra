"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faSpinner,
  faTag,
  faTags,
} from "@fortawesome/free-solid-svg-icons";
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#9E6E5B] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">
            Manage Orders
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by order number"
            className="w-full sm:w-80 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          {effectiveSelectedIds.size > 0 ? (
            <button
              onClick={handleBulkLabel}
              disabled={downloadBulk.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E2B16] text-white text-sm font-semibold hover:bg-[#4a2010] disabled:opacity-60 transition"
            >
              {downloadBulk.isPending ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faTags} />
              )}
              Download Labels ({effectiveSelectedIds.size})
            </button>
          ) : null}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2ECDF] text-[#5E2B16]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleSelectAll}
                    disabled={eligibleOrders.length === 0}
                    title="Select all eligible orders"
                    className="accent-[#819744]"
                  />
                </th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Order Status</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Total Paid</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={8}>Loading orders...</td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td className="px-4 py-4 text-red-600" colSpan={8}>{ordersError}</td>
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
                    <tr key={order.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={effectiveSelectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          disabled={!eligible}
                          title={eligible ? "Select for bulk label" : "Not eligible for shipping label"}
                          className="accent-[#819744] disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono">{order.orderNumber}</td>
                      <td className="px-4 py-3">{order.userId}</td>
                      <td className="px-4 py-3">{ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}</td>
                      <td className="px-4 py-3">{PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}</td>
                      <td className="px-4 py-3">₹{order.totalPaid}</td>
                      <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleAdvance(order.orderNumber, order.orderStatus)}
                            disabled={updateStatus.isPending || order.orderStatus >= 4 || order.orderStatus === 5}
                            className="px-3 py-1 rounded bg-[#819744] text-white text-xs disabled:opacity-50"
                          >
                            Advance
                          </button>
                          <button
                            onClick={() => handleViewInvoice(order.orderNumber)}
                            className="px-3 py-1 rounded bg-[#5B8D7C] text-white text-xs"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => handleRegenerateInvoicePdf(order.orderNumber)}
                            disabled={regeneratingOrder === order.orderNumber}
                            className="px-3 py-1 rounded bg-[#9E6E5B] text-white text-xs disabled:opacity-50"
                          >
                            {regeneratingOrder === order.orderNumber ? "Regenerating..." : "Regen PDF"}
                          </button>
                          {eligible ? (
                            <button
                              onClick={() => handleSingleLabel(order.id)}
                              disabled={isSinglePending}
                              className="px-3 py-1 rounded bg-[#5E2B16] text-white text-xs disabled:opacity-50 inline-flex items-center gap-1"
                              title="Download shipping label PDF"
                            >
                              {isSinglePending ? (
                                <FontAwesomeIcon icon={faSpinner} spin />
                              ) : (
                                <FontAwesomeIcon icon={faTag} />
                              )}
                              Label
                            </button>
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
          <div className="flex items-center justify-between mt-4 text-sm text-[#5E2B16]">
            <span>
              Page {safePage} of {totalPages} ({allOrders.length} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {(invoiceOrderNumber || invoiceError || selectedInvoice) ? (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#5E2B16]">
                Invoice: {invoiceOrderNumber ?? "-"}
              </h2>
              {invoiceOrderNumber ? (
                <button
                  onClick={() => handleRegenerateInvoicePdf(invoiceOrderNumber, true)}
                  disabled={regeneratingOrder === invoiceOrderNumber}
                  className="px-3 py-1 rounded bg-[#6C79A8] text-white disabled:opacity-50"
                >
                  Force Regenerate
                </button>
              ) : null}
            </div>

            {invoiceLoading ? <p className="text-sm">Loading invoice...</p> : null}
            {invoiceError ? <p className="text-sm text-red-600">{invoiceError}</p> : null}

            {selectedInvoice ? (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#6f665b]">Invoice Number</p>
                  <p className="font-medium text-[#5E2B16]">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-[#6f665b]">Issued At</p>
                  <p className="font-medium text-[#5E2B16]">
                    {new Date(selectedInvoice.issuedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#6f665b]">Total</p>
                  <p className="font-medium text-[#5E2B16]">₹{selectedInvoice.totalAmount}</p>
                </div>
                <div>
                  <p className="text-[#6f665b]">PDF Status</p>
                  <p className="font-medium text-[#5E2B16]">{selectedInvoice.pdfStatus}</p>
                </div>
                <div className="md:col-span-2">
                  {selectedInvoice.pdfUrl ? (
                    <a
                      href={selectedInvoice.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex px-3 py-1.5 rounded bg-[#819744] text-white"
                    >
                      Open PDF
                    </a>
                  ) : (
                    <p className="text-[#6f665b]">No PDF URL yet. Use regenerate action.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
  );
}
