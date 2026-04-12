"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { useAdminOrders, useIsAdmin, useUpdateAdminOrderStatus } from "@/hooks/useAdmin";
import {
  getAdminOrderInvoice,
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

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoiceResponse | null>(null);
  const [invoiceOrderNumber, setInvoiceOrderNumber] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [regeneratingOrder, setRegeneratingOrder] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search: search || undefined,
    sortOrder: "desc",
  });
  const updateStatus = useUpdateAdminOrderStatus();

  if (adminLoading) {
    return <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">Checking access…</div>;
  }

  if (!isAdmin) {
    router.replace("/");
    return null;
  }

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const handleAdvance = (orderNumber: string, currentStatus: number) => {
    const nextStatus = currentStatus + 1;
    if (nextStatus > 4) return;
    updateStatus.mutate({
      orderNumber,
      newStatus: nextStatus,
      note: "Status updated from admin panel",
    });
  };

  const handleViewInvoice = async (orderNumber: string) => {
    setInvoiceError(null);
    setInvoiceLoading(true);
    setInvoiceOrderNumber(orderNumber);

    try {
      const invoice = await getAdminOrderInvoice(orderNumber);
      setSelectedInvoice(invoice);
    } catch (err: any) {
      setSelectedInvoice(null);
      setInvoiceError(err.message ?? "Failed to load invoice");
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
    } catch (err: any) {
      setInvoiceError(err.message ?? "Failed to regenerate PDF");
    } finally {
      setRegeneratingOrder(null);
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-[#819744] hover:text-[#5E2B16] mb-8 transition text-sm font-medium">
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Admin
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#9E6E5B] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">Manage Orders</h1>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by order number"
            className="w-full md:w-80 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2ECDF] text-[#5E2B16]">
              <tr>
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
              {isLoading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={7}>Loading orders…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-4" colSpan={7}>No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.userId}</td>
                    <td className="px-4 py-3">{ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}</td>
                    <td className="px-4 py-3">{PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}</td>
                    <td className="px-4 py-3">₹{order.totalPaid}</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAdvance(order.orderNumber, order.orderStatus)}
                          disabled={updateStatus.isPending || order.orderStatus >= 4 || order.orderStatus === 5}
                          className="px-3 py-1 rounded bg-[#819744] text-white disabled:opacity-50"
                        >
                          Advance
                        </button>
                        <button
                          onClick={() => handleViewInvoice(order.orderNumber)}
                          className="px-3 py-1 rounded bg-[#5B8D7C] text-white"
                        >
                          Invoice
                        </button>
                        <button
                          onClick={() => handleRegenerateInvoicePdf(order.orderNumber)}
                          disabled={regeneratingOrder === order.orderNumber}
                          className="px-3 py-1 rounded bg-[#9E6E5B] text-white disabled:opacity-50"
                        >
                          {regeneratingOrder === order.orderNumber ? "Regenerating..." : "Regen PDF"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <div className="flex items-center justify-between mt-4 text-sm text-[#5E2B16]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {(invoiceOrderNumber || invoiceError || selectedInvoice) && (
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
        )}
      </div>
    </section>
  );
}

