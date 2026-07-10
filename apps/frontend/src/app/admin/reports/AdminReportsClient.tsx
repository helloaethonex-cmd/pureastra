"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faDownload,
  faRotate,
  faFilePdf,
  faFileExcel,
  faPlus,
  faTrash,
  faPen,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  useAdminGstDetailed,
  useAdminGstSummary,
  useAdminOverviewReport,
  useDownloadAdminGstCsv,
  useIsAdmin,
  useManualInvoices,
  useCreateManualInvoice,
  useUpdateManualInvoice,
} from "@/hooks/useAdmin";
import type { AdminGstDetailedRow, ManualInvoice } from "@/services/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const asCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

async function downloadPdf(
  rows: AdminGstDetailedRow[],
  totals: { taxableValue: string; cgst: string; sgst: string; igst: string },
  from: string,
  to: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`GST Report: ${from} to ${to}`, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [["Invoice", "Issued", "Customer", "State", "Taxable", "GST%", "CGST", "SGST", "IGST"]],
    body: rows.map((r) => [
      r.invoiceNumber,
      new Date(r.issuedAt).toLocaleDateString(),
      r.customerName || "-",
      r.customerState || "-",
      r.taxableValue,
      `${r.gstRate}%`,
      r.cgst,
      r.sgst,
      r.igst,
    ]),
    foot: [["TOTAL", "", "", "", totals.taxableValue, "", totals.cgst, totals.sgst, totals.igst]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [94, 43, 22] },
    footStyles: { fillColor: [242, 236, 223], textColor: [94, 43, 22], fontStyle: "bold" },
  });
  doc.save(`gst-report-${from}-to-${to}.pdf`);
}

async function downloadExcel(
  rows: AdminGstDetailedRow[],
  totals: { taxableValue: string; cgst: string; sgst: string; igst: string },
  from: string,
  to: string,
) {
  const XLSX = await import("xlsx");
  const header = ["Invoice", "Issued", "Customer", "State", "Taxable Value", "GST Rate", "CGST", "SGST", "IGST", "Total Amount"];
  const data = rows.map((r) => [
    r.invoiceNumber,
    new Date(r.issuedAt).toLocaleDateString(),
    r.customerName || "-",
    r.customerState || "-",
    Number(r.taxableValue),
    `${r.gstRate}%`,
    Number(r.cgst),
    Number(r.sgst),
    Number(r.igst),
    Number(r.totalAmount),
  ]);
  const totalRow = ["TOTAL", "", "", "", Number(totals.taxableValue), "", Number(totals.cgst), Number(totals.sgst), Number(totals.igst), ""];
  const ws = XLSX.utils.aoa_to_sheet([header, ...data, totalRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "GST Report");
  XLSX.writeFile(wb, `gst-report-${from}-to-${to}.xlsx`);
}

// ─── Manual invoice form types ───────────────────────────────────────────────

interface LineItem {
  productName: string;
  totalPrice: string;
  gstRate: string;
}

const emptyLine = (): LineItem => ({ productName: "", totalPrice: "", gstRate: "18" });

const GST_RATES = ["0", "5", "12", "18", "28"];

// ─── Manual Invoice Form ─────────────────────────────────────────────────────

function ManualInvoiceForm({
  initial,
  onClose,
}: {
  initial?: ManualInvoice;
  onClose: () => void;
}) {
  const create = useCreateManualInvoice();
  const update = useUpdateManualInvoice();
  const isPending = create.isPending || update.isPending;

  const [invoiceDate, setInvoiceDate] = useState(
    initial ? isoDate(new Date(initial.issuedAt)) : isoDate(new Date()),
  );
  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initial?.customerPhone ?? "");
  const [customerState, setCustomerState] = useState(initial?.customerState ?? "");

  const isKerala = customerState.trim().toLowerCase() === "kerala";
  // Derived — no manual override allowed
  const isInterstate = customerState.trim() !== "" && !isKerala;
  const stateTypeLabel =
    customerState.trim() === ""
      ? null
      : isKerala
        ? "Intrastate — CGST + SGST (Kerala)"
        : "Interstate — IGST (outside Kerala)";

  const [items, setItems] = useState<LineItem[]>(
    initial?.items.length
      ? initial.items.map((i) => ({
          productName: i.productName,
          totalPrice: i.totalPrice,
          gstRate: i.gstRate,
        }))
      : [emptyLine()],
  );
  const [error, setError] = useState<string | null>(null);

  const updateItem = (idx: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // Live GST preview for each line
  const computedLines = items.map((it) => {
    const price = Number(it.totalPrice) || 0;
    const rate = Number(it.gstRate) || 0;
    const taxable = price / (1 + rate / 100);
    const tax = price - taxable;
    return { taxable: taxable.toFixed(2), tax: tax.toFixed(2) };
  });

  const totalPrice = items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
  const totalTax = computedLines.reduce((s, l) => s + Number(l.tax), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const payload = {
      invoiceDate,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerState: customerState.trim(),
      isInterstate,
      items: items.map((it) => ({
        productName: it.productName.trim(),
        totalPrice: Number(it.totalPrice),
        gstRate: Number(it.gstRate),
      })),
    };
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, body: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Failed to save invoice");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#5E2B16]">
            {initial ? "Edit Manual Invoice" : "Create Manual Invoice"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Invoice date */}
          <div>
            <label className="block text-xs text-[#6f665b] mb-1">Invoice Date</label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">Customer Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Gauri"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">Phone (optional)</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#6f665b] mb-1">Customer State</label>
            <input
              type="text"
              required
              placeholder="e.g. Kerala"
              value={customerState}
              onChange={(e) => setCustomerState(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                customerState.trim() !== "" ? "border-gray-200" : "border-gray-200"
              }`}
            />
            {stateTypeLabel && (
              <p className={`mt-1.5 text-xs font-medium inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
                isKerala
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
              }`}>
                {stateTypeLabel}
              </p>
            )}
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#6f665b] font-medium">Products</label>
              <button
                type="button"
                onClick={() => setItems((p) => [...p, emptyLine()])}
                className="text-xs text-[#819744] hover:underline inline-flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add product
              </button>
            </div>

            <div className="space-y-2">
              {/* header */}
              <div className="grid grid-cols-[1fr_100px_80px_80px_80px_24px] gap-2 text-[10px] text-[#6f665b] px-1">
                <span>Product name</span>
                <span>Price (incl. GST)</span>
                <span>GST %</span>
                <span>Taxable</span>
                <span>GST amt</span>
                <span />
              </div>

              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_100px_80px_80px_80px_24px] gap-2 items-center"
                >
                  <input
                    type="text"
                    required
                    placeholder="Product name"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, "productName", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="395"
                    value={item.totalPrice}
                    onChange={(e) => updateItem(idx, "totalPrice", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <select
                    value={item.gstRate}
                    onChange={(e) => updateItem(idx, "gstRate", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                  <span className="text-xs text-center text-[#5E2B16]">
                    ₹{computedLines[idx].taxable}
                  </span>
                  <span className="text-xs text-center text-[#5E2B16]">
                    ₹{computedLines[idx].tax}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              ))}
            </div>

            {/* totals preview */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-sm flex justify-between text-[#5E2B16]">
              <span>Total: {asCurrency(totalPrice)}</span>
              <span>
                {isInterstate
                  ? `IGST: ${asCurrency(totalTax)}`
                  : `CGST: ${asCurrency(totalTax / 2)} | SGST: ${asCurrency(totalTax / 2)}`}
              </span>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm bg-[#5E2B16] text-white rounded-lg hover:bg-[#4d2312] disabled:opacity-50 inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCheck} />
              {isPending ? "Saving…" : initial ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Manual Invoices Tab ─────────────────────────────────────────────────────

function ManualInvoicesTab() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManualInvoice | null>(null);
  const { data, isLoading, isError, error } = useManualInvoices({ page, limit: 20 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6f665b]">
          Invoices created manually for WhatsApp / offline orders.
        </p>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#5E2B16] text-white text-sm rounded-lg hover:bg-[#4d2312] inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          New Invoice
        </button>
      </div>

      {(showForm || editing) && (
        <ManualInvoiceForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F2ECDF] text-[#5E2B16]">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">State</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">GST</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-4 text-[#6f665b]">Loading…</td></tr>
            ) : isError ? (
              <tr><td colSpan={8} className="px-4 py-4 text-red-600">{(error as Error)?.message}</td></tr>
            ) : data?.rows.length ? (
              data.rows.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{inv.customerName}</td>
                  <td className="px-4 py-3">{inv.customerState || "-"}</td>
                  <td className="px-4 py-3">{asCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3">{asCurrency(inv.taxAmount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {inv.igst && Number(inv.igst) > 0 ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Interstate</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Intrastate</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => { setEditing(inv); setShowForm(false); }}
                      className="text-[#819744] hover:text-[#5E2B16] text-xs inline-flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faPen} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-4 py-4 text-[#6f665b]">No manual invoices yet.</td></tr>
            )}
          </tbody>
        </table>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-[#6f665b]">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.pagination.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >Prev</button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [tab, setTab] = useState<"gst" | "manual">("gst");

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

  const [from, setFrom] = useState(isoDate(monthStart));
  const [to, setTo] = useState(isoDate(today));
  const [sort, setSort] = useState<"issuedAt:asc" | "issuedAt:desc">("issuedAt:desc");
  const [page, setPage] = useState(1);
  const [pdfPending, setPdfPending] = useState(false);
  const [xlsxPending, setXlsxPending] = useState(false);

  const overview = useAdminOverviewReport({ from, to });
  const summary = useAdminGstSummary({ from, to, sort });
  const detailed = useAdminGstDetailed({ from, to, sort, page, limit: 20 });
  const downloadCsv = useDownloadAdminGstCsv();

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

  const handleExportCsv = async (exportAll: boolean) => {
    try {
      const blob = await downloadCsv.mutateAsync({ from, to, sort, page, limit: 20, exportAll });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gst-report-${from}-to-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* surfaced via mutation state */ }
  };

  const handleExportPdf = async (exportAll: boolean) => {
    setPdfPending(true);
    try {
      if (exportAll) {
        const { getAdminGstReportDetailed } = await import("@/services/api");
        const data = await getAdminGstReportDetailed({ from, to, sort, page: 1, limit: 20000 });
        await downloadPdf(data.rows, data.totals, from, to);
      } else if (detailed.data) {
        await downloadPdf(detailed.data.rows, detailed.data.totals, from, to);
      }
    } finally { setPdfPending(false); }
  };

  const handleExportExcel = async (exportAll: boolean) => {
    setXlsxPending(true);
    try {
      if (exportAll) {
        const { getAdminGstReportDetailed } = await import("@/services/api");
        const data = await getAdminGstReportDetailed({ from, to, sort, page: 1, limit: 20000 });
        await downloadExcel(data.rows, data.totals, from, to);
      } else if (detailed.data) {
        await downloadExcel(detailed.data.rows, detailed.data.totals, from, to);
      }
    } finally { setXlsxPending(false); }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#5B8D7C] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">Reports</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(["gst", "manual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${
                tab === t
                  ? "bg-white border border-b-white border-gray-200 text-[#5E2B16] -mb-px"
                  : "text-[#6f665b] hover:text-[#5E2B16]"
              }`}
            >
              {t === "gst" ? "GST Reports" : "Manual Invoices"}
            </button>
          ))}
        </div>

        {/* ── GST Reports tab ───────────────────────────────────────────── */}
        {tab === "gst" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-[#6f665b] mb-1">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6f665b] mb-1">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => { setTo(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6f665b] mb-1">GST Sort</label>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value as "issuedAt:asc" | "issuedAt:desc"); setPage(1); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="issuedAt:desc">Issued At Desc</option>
                    <option value="issuedAt:asc">Issued At Asc</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => { overview.refetch(); summary.refetch(); detailed.refetch(); }}
                    className="px-3 py-2 rounded-lg bg-[#9E6E5B] text-white text-sm hover:bg-[#8a5e4e] inline-flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faRotate} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-[#6f665b] self-center font-medium">CSV:</span>
                <button type="button" onClick={() => handleExportCsv(false)} disabled={downloadCsv.isPending}
                  className="px-3 py-1.5 rounded-lg bg-[#819744] text-white text-xs hover:bg-[#6d8039] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDownload} />Page
                </button>
                <button type="button" onClick={() => handleExportCsv(true)} disabled={downloadCsv.isPending}
                  className="px-3 py-1.5 rounded-lg bg-[#5B8D7C] text-white text-xs hover:bg-[#4a7466] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faDownload} />All
                </button>
                <span className="text-xs text-[#6f665b] self-center font-medium ml-2">PDF:</span>
                <button type="button" onClick={() => handleExportPdf(false)} disabled={pdfPending || !detailed.data}
                  className="px-3 py-1.5 rounded-lg bg-[#C0392B] text-white text-xs hover:bg-[#a93226] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFilePdf} />Page
                </button>
                <button type="button" onClick={() => handleExportPdf(true)} disabled={pdfPending}
                  className="px-3 py-1.5 rounded-lg bg-[#922B21] text-white text-xs hover:bg-[#7b241c] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFilePdf} />All
                </button>
                <span className="text-xs text-[#6f665b] self-center font-medium ml-2">Excel:</span>
                <button type="button" onClick={() => handleExportExcel(false)} disabled={xlsxPending || !detailed.data}
                  className="px-3 py-1.5 rounded-lg bg-[#1E8449] text-white text-xs hover:bg-[#196f3d] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFileExcel} />Page
                </button>
                <button type="button" onClick={() => handleExportExcel(true)} disabled={xlsxPending}
                  className="px-3 py-1.5 rounded-lg bg-[#196f3d] text-white text-xs hover:bg-[#145a32] disabled:opacity-50 inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faFileExcel} />All
                </button>
              </div>

              {downloadCsv.isError && (
                <p className="text-red-600 text-sm mt-3">
                  {(downloadCsv.error as Error)?.message ?? "Failed to export CSV"}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Revenue", value: overview.data?.totalRevenue ?? 0 },
                { label: "Profit", value: overview.data?.profit ?? 0 },
                { label: "Influencer Commission", value: overview.data?.influencerCommission ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-[#6f665b] uppercase">{label}</p>
                  <p className="text-xl font-semibold text-[#5E2B16] mt-1">{asCurrency(value)}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <h2 className="text-lg font-semibold text-[#5E2B16] mb-4">GST Summary</h2>
              {summary.isLoading ? (
                <p className="text-sm text-[#6f665b]">Loading GST summary...</p>
              ) : summary.isError ? (
                <p className="text-sm text-red-600">{(summary.error as Error)?.message ?? "Failed to load summary"}</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-[#6f665b]">Total Invoices</p><p className="text-[#5E2B16] font-semibold">{summary.data?.totalInvoices ?? 0}</p></div>
                  <div><p className="text-[#6f665b]">Taxable Value</p><p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalTaxableValue ?? 0)}</p></div>
                  <div><p className="text-[#6f665b]">Total GST</p><p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalGST ?? 0)}</p></div>
                  <div><p className="text-[#6f665b]">CGST</p><p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalCGST ?? 0)}</p></div>
                  <div><p className="text-[#6f665b]">SGST</p><p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalSGST ?? 0)}</p></div>
                  <div><p className="text-[#6f665b]">IGST</p><p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalIGST ?? 0)}</p></div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#5E2B16]">GST Detailed</h2>
                {detailed.data && (
                  <span className="text-xs text-[#6f665b]">
                    Page {detailed.data.pagination.page} of {Math.max(detailed.data.pagination.totalPages, 1)}
                  </span>
                )}
              </div>

              <table className="w-full text-sm">
                <thead className="bg-[#F2ECDF] text-[#5E2B16]">
                  <tr>
                    <th className="text-left px-4 py-3">Invoice</th>
                    <th className="text-left px-4 py-3">Issued</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">State</th>
                    <th className="text-left px-4 py-3">Taxable</th>
                    <th className="text-left px-4 py-3">GST Rate</th>
                    <th className="text-left px-4 py-3">CGST</th>
                    <th className="text-left px-4 py-3">SGST</th>
                    <th className="text-left px-4 py-3">IGST</th>
                  </tr>
                </thead>
                <tbody>
                  {detailed.isLoading ? (
                    <tr><td className="px-4 py-4" colSpan={9}>Loading rows...</td></tr>
                  ) : detailed.isError ? (
                    <tr><td className="px-4 py-4 text-red-600" colSpan={9}>{(detailed.error as Error)?.message ?? "Failed to load rows"}</td></tr>
                  ) : detailed.data?.rows.length ? (
                    detailed.data.rows.map((row) => (
                      <tr key={`${row.invoiceNumber}-${row.issuedAt}`} className="border-t border-gray-100">
                        <td className="px-4 py-3">{row.invoiceNumber}</td>
                        <td className="px-4 py-3">{new Date(row.issuedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{row.customerName || "-"}</td>
                        <td className="px-4 py-3">{row.customerState || "-"}</td>
                        <td className="px-4 py-3">{asCurrency(row.taxableValue)}</td>
                        <td className="px-4 py-3">{row.gstRate}%</td>
                        <td className="px-4 py-3">{asCurrency(row.cgst)}</td>
                        <td className="px-4 py-3">{asCurrency(row.sgst)}</td>
                        <td className="px-4 py-3">{asCurrency(row.igst)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-4 py-4" colSpan={9}>No GST records found for this range.</td></tr>
                  )}
                </tbody>
              </table>

              {detailed.data && (
                <div className="px-4 py-3 border-t border-gray-100 text-sm flex items-center justify-between">
                  <div className="text-[#5E2B16]">
                    Totals: Taxable {asCurrency(detailed.data.totals.taxableValue)} | CGST {asCurrency(detailed.data.totals.cgst)} | SGST {asCurrency(detailed.data.totals.sgst)} | IGST {asCurrency(detailed.data.totals.igst)}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={detailed.data.pagination.page <= 1}
                      className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                    <button type="button"
                      onClick={() => setPage((p) => Math.min(Math.max(detailed.data.pagination.totalPages, 1), p + 1))}
                      disabled={detailed.data.pagination.totalPages === 0 || detailed.data.pagination.page >= detailed.data.pagination.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Manual Invoices tab ───────────────────────────────────────── */}
        {tab === "manual" && <ManualInvoicesTab />}
      </div>
  );
}
