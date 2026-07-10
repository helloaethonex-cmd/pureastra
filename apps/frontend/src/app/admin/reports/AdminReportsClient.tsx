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
import {
  Badge,
  Button,
  DataTable,
  Field,
  Modal,
  PageHeader,
  Select,
  StatCard,
  TextInput,
} from "../_components";
import type { DataTableColumn } from "../_components";

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
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit Manual Invoice" : "Create Manual Invoice"}
      className="max-w-2xl max-h-[85vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Invoice Date" htmlFor="mi-date" required>
          <TextInput
            id="mi-date"
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Customer Name" htmlFor="mi-name" required>
            <TextInput
              id="mi-name"
              required
              placeholder="e.g. Gauri"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label="Phone (optional)" htmlFor="mi-phone">
            <TextInput
              id="mi-phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Customer State" htmlFor="mi-state" required>
          <TextInput
            id="mi-state"
            required
            placeholder="e.g. Kerala"
            value={customerState}
            onChange={(e) => setCustomerState(e.target.value)}
          />
        </Field>
        {stateTypeLabel && <Badge role={isKerala ? "success" : "info"}>{stateTypeLabel}</Badge>}

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-secondary)]">
              Products
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setItems((p) => [...p, emptyLine()])}>
              <FontAwesomeIcon icon={faPlus} />
              Add product
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_80px_80px_80px_24px] gap-2 px-1 text-[length:var(--admin-text-2xs)] text-[var(--admin-ink-muted)]">
              <span>Product name</span>
              <span>Price (incl. GST)</span>
              <span>GST %</span>
              <span>Taxable</span>
              <span>GST amt</span>
              <span />
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_100px_80px_80px_80px_24px] items-center gap-2">
                <TextInput
                  required
                  placeholder="Product name"
                  value={item.productName}
                  onChange={(e) => updateItem(idx, "productName", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                />
                <TextInput
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="395"
                  value={item.totalPrice}
                  onChange={(e) => updateItem(idx, "totalPrice", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                />
                <Select
                  value={item.gstRate}
                  onChange={(e) => updateItem(idx, "gstRate", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                >
                  {GST_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </Select>
                <span className="text-center text-[length:var(--admin-text-xs)] text-[var(--admin-ink)]">
                  ₹{computedLines[idx].taxable}
                </span>
                <span className="text-center text-[length:var(--admin-text-xs)] text-[var(--admin-ink)]">
                  ₹{computedLines[idx].tax}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="text-[var(--admin-ink-muted)] hover:text-[var(--admin-error-fg)] disabled:opacity-30"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between border-t border-[var(--admin-border)] pt-3 text-[length:var(--admin-text-sm)] text-[var(--admin-ink)]">
            <span>Total: {asCurrency(totalPrice)}</span>
            <span>
              {isInterstate
                ? `IGST: ${asCurrency(totalTax)}`
                : `CGST: ${asCurrency(totalTax / 2)} | SGST: ${asCurrency(totalTax / 2)}`}
            </span>
          </div>
        </div>

        {error && <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} loading={isPending}>
            <FontAwesomeIcon icon={faCheck} />
            {isPending ? "Saving…" : initial ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Manual Invoices Tab ─────────────────────────────────────────────────────

function ManualInvoicesTab() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ManualInvoice | null>(null);
  const { data, isLoading, isError, error } = useManualInvoices({ page, limit: 20 });

  const columns: DataTableColumn<ManualInvoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (inv) => <span className="font-mono text-[length:var(--admin-text-xs)]">{inv.invoiceNumber}</span>,
    },
    { key: "date", header: "Date", render: (inv) => new Date(inv.issuedAt).toLocaleDateString() },
    { key: "customer", header: "Customer", render: (inv) => inv.customerName },
    { key: "state", header: "State", render: (inv) => inv.customerState || "-" },
    { key: "total", header: "Total", render: (inv) => asCurrency(inv.totalAmount) },
    { key: "gst", header: "GST", render: (inv) => asCurrency(inv.taxAmount) },
    {
      key: "type",
      header: "Type",
      render: (inv) =>
        inv.igst && Number(inv.igst) > 0 ? (
          <Badge role="info">Interstate</Badge>
        ) : (
          <Badge role="success">Intrastate</Badge>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">
          Invoices created manually for WhatsApp / offline orders.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <FontAwesomeIcon icon={faPlus} />
          New Invoice
        </Button>
      </div>

      {(showForm || editing) && (
        <ManualInvoiceForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(inv) => inv.id}
        loading={isLoading}
        error={isError ? ((error as Error)?.message ?? "Failed to load manual invoices") : undefined}
        emptyIcon={faFileInvoiceDollar}
        emptyHeading="No manual invoices yet"
        emptyMessage="Create your first manual invoice for a WhatsApp or offline order."
        pagination={
          data
            ? { page: data.pagination.page, pageCount: Math.max(data.pagination.totalPages, 1), onPageChange: setPage }
            : undefined
        }
        rowActions={(inv) => (
          <Button size="sm" variant="secondary" onClick={() => { setEditing(inv); setShowForm(false); }}>
            <FontAwesomeIcon icon={faPen} />
            Edit
          </Button>
        )}
      />
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
        <PageHeader title="Reports" breadcrumb="Admin / Reports" />

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-[var(--admin-border)]">
          {(["gst", "manual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t-[var(--admin-r-md)] px-5 py-2.5 text-[length:var(--admin-text-sm)] font-medium transition-colors duration-[var(--admin-duration-occasional)] ${
                tab === t
                  ? "-mb-px border border-b-[var(--admin-card-bg)] border-[var(--admin-border)] bg-[var(--admin-card-bg)] text-[var(--admin-primary)]"
                  : "text-[var(--admin-ink-muted)] hover:text-[var(--admin-primary)]"
              }`}
            >
              {t === "gst" ? "GST Reports" : "Manual Invoices"}
            </button>
          ))}
        </div>

        {/* ── GST Reports tab ───────────────────────────────────────────── */}
        {tab === "gst" && (
          <>
            <div className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="From" htmlFor="rep-from">
                  <TextInput
                    id="rep-from"
                    type="date"
                    value={from}
                    onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                  />
                </Field>
                <Field label="To" htmlFor="rep-to">
                  <TextInput
                    id="rep-to"
                    type="date"
                    value={to}
                    onChange={(e) => { setTo(e.target.value); setPage(1); }}
                  />
                </Field>
                <Field label="GST Sort" htmlFor="rep-sort">
                  <Select
                    id="rep-sort"
                    value={sort}
                    onChange={(e) => { setSort(e.target.value as "issuedAt:asc" | "issuedAt:desc"); setPage(1); }}
                  >
                    <option value="issuedAt:desc">Issued At Desc</option>
                    <option value="issuedAt:asc">Issued At Asc</option>
                  </Select>
                </Field>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => { overview.refetch(); summary.refetch(); detailed.refetch(); }}
                  >
                    <FontAwesomeIcon icon={faRotate} />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="ml-0 self-center text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-muted)]">CSV:</span>
                <Button size="sm" onClick={() => handleExportCsv(false)} disabled={downloadCsv.isPending}>
                  <FontAwesomeIcon icon={faDownload} />Page
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleExportCsv(true)} disabled={downloadCsv.isPending}>
                  <FontAwesomeIcon icon={faDownload} />All
                </Button>
                <span className="ml-2 self-center text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-muted)]">PDF:</span>
                <Button size="sm" variant="danger" onClick={() => handleExportPdf(false)} disabled={pdfPending || !detailed.data} loading={pdfPending}>
                  <FontAwesomeIcon icon={faFilePdf} />Page
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleExportPdf(true)} disabled={pdfPending} loading={pdfPending}>
                  <FontAwesomeIcon icon={faFilePdf} />All
                </Button>
                <span className="ml-2 self-center text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-muted)]">Excel:</span>
                <Button size="sm" onClick={() => handleExportExcel(false)} disabled={xlsxPending || !detailed.data} loading={xlsxPending}>
                  <FontAwesomeIcon icon={faFileExcel} />Page
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleExportExcel(true)} disabled={xlsxPending} loading={xlsxPending}>
                  <FontAwesomeIcon icon={faFileExcel} />All
                </Button>
              </div>

              {downloadCsv.isError && (
                <p className="mt-3 text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">
                  {(downloadCsv.error as Error)?.message ?? "Failed to export CSV"}
                </p>
              )}
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Revenue" value={Number(overview.data?.totalRevenue ?? 0)} currency loading={overview.isLoading} />
              <StatCard label="Profit" value={Number(overview.data?.profit ?? 0)} currency loading={overview.isLoading} />
              <StatCard
                label="Influencer Commission"
                value={Number(overview.data?.influencerCommission ?? 0)}
                currency
                loading={overview.isLoading}
              />
            </div>

            <div className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-5">
              <h2 className="mb-4 text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">GST Summary</h2>
              {summary.isLoading ? (
                <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">Loading GST summary...</p>
              ) : summary.isError ? (
                <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">
                  {(summary.error as Error)?.message ?? "Failed to load summary"}
                </p>
              ) : (
                <div className="grid gap-4 text-[length:var(--admin-text-sm)] md:grid-cols-3">
                  {[
                    ["Total Invoices", summary.data?.totalInvoices ?? 0],
                    ["Taxable Value", asCurrency(summary.data?.totalTaxableValue ?? 0)],
                    ["Total GST", asCurrency(summary.data?.totalGST ?? 0)],
                    ["CGST", asCurrency(summary.data?.totalCGST ?? 0)],
                    ["SGST", asCurrency(summary.data?.totalSGST ?? 0)],
                    ["IGST", asCurrency(summary.data?.totalIGST ?? 0)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[var(--admin-ink-muted)]">{label}</p>
                      <p className="font-semibold text-[var(--admin-ink)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)]">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
                <h2 className="text-[length:var(--admin-text-lg)] font-semibold text-[var(--admin-ink)]">GST Detailed</h2>
                {detailed.data && (
                  <span className="text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                    Page {detailed.data.pagination.page} of {Math.max(detailed.data.pagination.totalPages, 1)}
                  </span>
                )}
              </div>

              <table className="w-full text-[length:var(--admin-text-sm)]">
                <thead className="bg-[var(--admin-surface-alt)] text-[var(--admin-ink)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Issued</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">State</th>
                    <th className="px-4 py-3 text-left">Taxable</th>
                    <th className="px-4 py-3 text-left">GST Rate</th>
                    <th className="px-4 py-3 text-left">CGST</th>
                    <th className="px-4 py-3 text-left">SGST</th>
                    <th className="px-4 py-3 text-left">IGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {detailed.isLoading ? (
                    <tr><td className="px-4 py-4" colSpan={9}>Loading rows...</td></tr>
                  ) : detailed.isError ? (
                    <tr><td className="px-4 py-4 text-[var(--admin-error-fg)]" colSpan={9}>{(detailed.error as Error)?.message ?? "Failed to load rows"}</td></tr>
                  ) : detailed.data?.rows.length ? (
                    detailed.data.rows.map((row) => (
                      <tr key={`${row.invoiceNumber}-${row.issuedAt}`}>
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
                <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-3 text-[length:var(--admin-text-sm)]">
                  <div className="text-[var(--admin-ink)]">
                    Totals: Taxable {asCurrency(detailed.data.totals.taxableValue)} | CGST {asCurrency(detailed.data.totals.cgst)} | SGST {asCurrency(detailed.data.totals.sgst)} | IGST {asCurrency(detailed.data.totals.igst)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={detailed.data.pagination.page <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPage((p) => Math.min(Math.max(detailed.data.pagination.totalPages, 1), p + 1))}
                      disabled={detailed.data.pagination.totalPages === 0 || detailed.data.pagination.page >= detailed.data.pagination.totalPages}
                    >
                      Next
                    </Button>
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
