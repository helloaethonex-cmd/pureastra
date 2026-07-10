"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faPlus,
  faTrash,
  faPen,
  faCheck,
  faFileInvoiceDollar,
  faFilePdf,
  faFileExcel,
  faDownload,
  faRotate,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  useIsAdmin,
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useCreateWholesaleInvoice,
  useWholesaleInvoices,
  useRegenerateWholesaleInvoicePdf,
  useWholesaleReport,
} from "@/hooks/useAdmin";
import {
  downloadWholesaleReportCsv,
  type Vendor,
  type VendorPayload,
  type WholesaleInvoice,
  type WholesaleReportResponse,
} from "@/services/api";
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

// ─── Vendor Form Modal ────────────────────────────────────────────────────────

function VendorForm({ initial, onClose }: { initial?: Vendor; onClose: () => void }) {
  const create = useCreateVendor();
  const update = useUpdateVendor();
  const isPending = create.isPending || update.isPending;

  const [form, setForm] = useState<VendorPayload>({
    storeName: initial?.storeName ?? "",
    contactName: initial?.contactName ?? "",
    contactPhone: initial?.contactPhone ?? "",
    contactEmail: initial?.contactEmail ?? "",
    gstin: initial?.gstin ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    postalCode: initial?.postalCode ?? "",
    country: initial?.country ?? "India",
    status: initial?.status ?? "ACTIVE",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof VendorPayload, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const body: VendorPayload = {
      ...form,
      storeName: form.storeName.trim(),
      state: form.state.trim(),
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, body });
      else await create.mutateAsync(body);
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Failed to save vendor");
    }
  };

  const field = (
    label: string,
    key: keyof VendorPayload,
    opts?: { required?: boolean; placeholder?: string; type?: string },
  ) => (
    <Field label={label} htmlFor={`vendor-${key}`} required={opts?.required}>
      <TextInput
        id={`vendor-${key}`}
        type={opts?.type ?? "text"}
        required={opts?.required}
        placeholder={opts?.placeholder}
        value={(form[key] as string) ?? ""}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );

  return (
    <Modal open onClose={onClose} title={initial ? "Edit Vendor" : "Add Vendor"} className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field("Store Name", "storeName", { required: true, placeholder: "Freedom Supermarket" })}
          {field("GSTIN", "gstin", { placeholder: "32ABCDE1234F1Z5" })}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {field("Contact Name", "contactName")}
          {field("Phone", "contactPhone", { type: "tel" })}
          {field("Email", "contactEmail", { type: "email" })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("Address Line 1", "addressLine1")}
          {field("Address Line 2", "addressLine2")}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {field("City", "city")}
          {field("State", "state", { required: true, placeholder: "Kerala" })}
          {field("Postal Code", "postalCode")}
          {field("Country", "country")}
        </div>

        {initial && (
          <Field label="Status" htmlFor="vendor-status">
            <Select id="vendor-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
        )}

        {error && <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} loading={isPending}>
            <FontAwesomeIcon icon={faCheck} />
            {isPending ? "Saving…" : initial ? "Update Vendor" : "Add Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Vendors Tab ──────────────────────────────────────────────────────────────

function VendorsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const { data, isLoading, isError, error } = useVendors({ limit: 100 });

  const columns: DataTableColumn<Vendor>[] = [
    { key: "store", header: "Store", render: (v) => <span className="font-medium text-[var(--admin-ink)]">{v.storeName}</span> },
    { key: "gstin", header: "GSTIN", render: (v) => <span className="font-mono text-[length:var(--admin-text-xs)]">{v.gstin || "-"}</span> },
    { key: "state", header: "State", render: (v) => v.state },
    {
      key: "contact",
      header: "Contact",
      render: (v) => (
        <span className="text-[length:var(--admin-text-xs)]">
          {v.contactName || "-"}
          {v.contactPhone ? <><br />{v.contactPhone}</> : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <Badge role={v.status === "ACTIVE" ? "success" : "neutral"}>{v.status}</Badge>,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">
          Retailers and vendors you supply to wholesale.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <FontAwesomeIcon icon={faPlus} />
          Add Vendor
        </Button>
      </div>

      {(showForm || editing) && (
        <VendorForm initial={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(v) => v.id}
        loading={isLoading}
        error={isError ? ((error as Error)?.message ?? "Failed to load vendors") : undefined}
        emptyIcon={faStore}
        emptyHeading="No vendors yet"
        emptyMessage="Add a vendor to get started with wholesale orders."
        rowActions={(v) => (
          <Button size="sm" variant="secondary" onClick={() => { setEditing(v); setShowForm(false); }}>
            <FontAwesomeIcon icon={faPen} />Edit
          </Button>
        )}
      />
    </div>
  );
}

// ─── Wholesale Order Form ─────────────────────────────────────────────────────

interface OrderLine {
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
}

const emptyOrderLine = (): OrderLine => ({ productName: "", quantity: "1", unitPrice: "", gstRate: "18" });
const GST_RATES = ["0", "5", "12", "18", "28"];

function WholesaleOrderForm({ vendors, onClose }: { vendors: Vendor[]; onClose: () => void }) {
  const create = useCreateWholesaleInvoice();
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "");
  const [invoiceDate, setInvoiceDate] = useState(isoDate(new Date()));
  const [items, setItems] = useState<OrderLine[]>([emptyOrderLine()]);
  const [error, setError] = useState<string | null>(null);

  const selectedVendor = vendors.find((v) => v.id === vendorId);

  const updateItem = (idx: number, field: keyof OrderLine, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const computed = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const unit = Number(it.unitPrice) || 0;
    const rate = Number(it.gstRate) || 0;
    const lineTotal = qty * unit;
    const taxable = lineTotal / (1 + rate / 100);
    const tax = lineTotal - taxable;
    return { lineTotal, taxable, tax };
  });

  const totalAmount = computed.reduce((s, c) => s + c.lineTotal, 0);
  const totalTaxable = computed.reduce((s, c) => s + c.taxable, 0);
  const totalTax = computed.reduce((s, c) => s + c.tax, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!vendorId) { setError("Select a vendor"); return; }
    try {
      await create.mutateAsync({
        vendorId,
        body: {
          invoiceDate,
          items: items.map((it) => ({
            productName: it.productName.trim(),
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            gstRate: Number(it.gstRate),
          })),
        },
      });
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Failed to create invoice");
    }
  };

  return (
    <Modal open onClose={onClose} title="Create Wholesale Order" className="max-w-3xl max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vendor" htmlFor="wo-vendor">
            <Select id="wo-vendor" required value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="" disabled>Select a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.storeName} ({v.state})</option>
              ))}
            </Select>
          </Field>
          <Field label="Order / Invoice Date" htmlFor="wo-date">
            <TextInput id="wo-date" type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </Field>
        </div>

        {selectedVendor && (
          <p className="rounded-[var(--admin-r-md)] bg-[var(--admin-surface-alt)] px-3 py-2 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
            Billing <strong>{selectedVendor.storeName}</strong>
            {selectedVendor.gstin ? ` · GSTIN ${selectedVendor.gstin}` : ""} · {selectedVendor.state}.
            CGST/SGST vs IGST is determined automatically from the vendor&apos;s state.
          </p>
        )}

        {/* line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-secondary)]">Products</label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setItems((p) => [...p, emptyOrderLine()])}>
              <FontAwesomeIcon icon={faPlus} />Add product
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_70px_110px_70px_90px_24px] gap-2 px-1 text-[length:var(--admin-text-2xs)] text-[var(--admin-ink-muted)]">
              <span>Product name</span>
              <span>Qty</span>
              <span>Unit ₹ (incl GST)</span>
              <span>GST %</span>
              <span>Line total</span>
              <span />
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_70px_110px_70px_90px_24px] items-center gap-2">
                <TextInput
                  required
                  placeholder="PureAstra Face Wash"
                  value={item.productName}
                  onChange={(e) => updateItem(idx, "productName", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                />
                <TextInput
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="30"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                />
                <TextInput
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="80"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                />
                <Select
                  value={item.gstRate}
                  onChange={(e) => updateItem(idx, "gstRate", e.target.value)}
                  className="h-8 text-[length:var(--admin-text-sm)]"
                >
                  {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                </Select>
                <span className="text-center text-[length:var(--admin-text-xs)] text-[var(--admin-ink)]">
                  {asCurrency(computed[idx].lineTotal)}
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

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--admin-border)] pt-3 text-[length:var(--admin-text-sm)] text-[var(--admin-ink)]">
            <span>Taxable: {asCurrency(totalTaxable)}</span>
            <span>GST: {asCurrency(totalTax)}</span>
            <span className="text-right font-semibold">Total: {asCurrency(totalAmount)}</span>
          </div>
        </div>

        {error && <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending || !vendorId} loading={create.isPending}>
            <FontAwesomeIcon icon={faCheck} />
            {create.isPending ? "Generating…" : "Generate Invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Wholesale Invoices Tab ───────────────────────────────────────────────────

function WholesaleInvoicesTab() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const invoices = useWholesaleInvoices({ page, limit: 20 });
  const activeVendors = useVendors({ status: "ACTIVE", limit: 100 });
  const regenerate = useRegenerateWholesaleInvoicePdf();

  const vendorRows = activeVendors.data?.rows ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">
          Wholesale invoices. Download a PDF to send to the retailer.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => invoices.refetch()}>
            <FontAwesomeIcon icon={faRotate} />Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={vendorRows.length === 0}
            title={vendorRows.length === 0 ? "Add an active vendor first" : undefined}
          >
            <FontAwesomeIcon icon={faPlus} />New Order
          </Button>
        </div>
      </div>

      {showForm && <WholesaleOrderForm vendors={vendorRows} onClose={() => setShowForm(false)} />}

      <DataTable
        columns={[
          {
            key: "invoice",
            header: "Invoice",
            render: (inv: WholesaleInvoice) => <span className="font-mono text-[length:var(--admin-text-xs)]">{inv.invoiceNumber}</span>,
          },
          { key: "date", header: "Date", render: (inv: WholesaleInvoice) => new Date(inv.issuedAt).toLocaleDateString() },
          {
            key: "vendor",
            header: "Vendor",
            render: (inv: WholesaleInvoice) => (
              <span>
                {inv.vendorName}
                {inv.gstin ? <><br /><span className="font-mono text-[length:var(--admin-text-2xs)] text-[var(--admin-ink-muted)]">{inv.gstin}</span></> : null}
              </span>
            ),
          },
          { key: "taxable", header: "Taxable", render: (inv: WholesaleInvoice) => asCurrency(inv.taxableValue) },
          { key: "gst", header: "GST", render: (inv: WholesaleInvoice) => asCurrency(inv.taxAmount) },
          {
            key: "total",
            header: "Total",
            render: (inv: WholesaleInvoice) => <span className="font-medium">{asCurrency(inv.totalAmount)}</span>,
          },
          {
            key: "type",
            header: "Type",
            render: (inv: WholesaleInvoice) => (inv.isInterstate ? <Badge role="info">IGST</Badge> : <Badge role="success">CGST+SGST</Badge>),
          },
          {
            key: "pdf",
            header: "Invoice PDF",
            render: (inv: WholesaleInvoice) =>
              inv.pdfStatus === 1 && inv.pdfUrl ? (
                <a
                  href={inv.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[length:var(--admin-text-xs)] text-[var(--admin-error-fg)] hover:underline"
                >
                  <FontAwesomeIcon icon={faFilePdf} />Download
                </a>
              ) : inv.pdfStatus === 2 ? (
                <button
                  type="button"
                  onClick={() => regenerate.mutate(inv.id)}
                  className="inline-flex items-center gap-1 text-[length:var(--admin-text-xs)] text-[var(--admin-warning-fg)] hover:underline"
                >
                  <FontAwesomeIcon icon={faRotate} />Retry
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[length:var(--admin-text-xs)] text-[var(--admin-ink-muted)]">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />Generating…
                </span>
              ),
          },
        ] satisfies DataTableColumn<WholesaleInvoice>[]}
        rows={invoices.data?.rows ?? []}
        rowKey={(inv) => inv.id}
        loading={invoices.isLoading}
        error={invoices.isError ? ((invoices.error as Error)?.message ?? "Failed to load invoices") : undefined}
        emptyIcon={faFilePdf}
        emptyHeading="No wholesale invoices yet"
        emptyMessage="Create a wholesale order to generate your first invoice."
        pagination={
          invoices.data
            ? { page: invoices.data.pagination.page, pageCount: Math.max(invoices.data.pagination.totalPages, 1), onPageChange: setPage }
            : undefined
        }
      />

      {invoices.data?.rows.some((r) => r.pdfStatus === 0) && (
        <p className="mt-2 text-[length:var(--admin-text-sm)] text-[var(--admin-ink-muted)]">
          Some PDFs are still generating. Hit Refresh in a few seconds.
        </p>
      )}
    </div>
  );
}

// ─── GST Filing Report Tab ────────────────────────────────────────────────────

async function reportToPdf(report: WholesaleReportResponse) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`Wholesale GST Filing Report: ${report.from} to ${report.to}`, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [["Invoice", "Date", "Vendor", "GSTIN", "State", "Taxable", "CGST", "SGST", "IGST", "Total"]],
    body: report.rows.map((r) => [
      r.invoiceNumber,
      new Date(r.issuedAt).toLocaleDateString(),
      r.vendorName,
      r.gstin || "-",
      r.vendorState || "-",
      r.taxableValue,
      r.cgst,
      r.sgst,
      r.igst,
      r.totalAmount,
    ]),
    foot: [[
      "TOTAL", "", "", "", "",
      report.totals.taxableValue, report.totals.cgst, report.totals.sgst,
      report.totals.igst, report.totals.totalSales,
    ]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [94, 43, 22] },
    footStyles: { fillColor: [242, 236, 223], textColor: [94, 43, 22], fontStyle: "bold" },
  });
  doc.save(`wholesale-gst-${report.from}-to-${report.to}.pdf`);
}

async function reportToExcel(report: WholesaleReportResponse) {
  const XLSX = await import("xlsx");
  const header = ["Invoice", "Date", "Vendor", "GSTIN", "State", "Taxable Value", "CGST", "SGST", "IGST", "Total"];
  const data = report.rows.map((r) => [
    r.invoiceNumber,
    new Date(r.issuedAt).toLocaleDateString(),
    r.vendorName,
    r.gstin || "-",
    r.vendorState || "-",
    Number(r.taxableValue),
    Number(r.cgst),
    Number(r.sgst),
    Number(r.igst),
    Number(r.totalAmount),
  ]);
  const totalRow = [
    "TOTAL", "", "", "", "",
    Number(report.totals.taxableValue), Number(report.totals.cgst),
    Number(report.totals.sgst), Number(report.totals.igst), Number(report.totals.totalSales),
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...data, totalRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Wholesale GST");
  XLSX.writeFile(wb, `wholesale-gst-${report.from}-to-${report.to}.xlsx`);
}

function ReportTab() {
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const [from, setFrom] = useState(isoDate(monthStart));
  const [to, setTo] = useState(isoDate(today));
  const [csvPending, setCsvPending] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const report = useWholesaleReport({ from, to });

  const handleCsv = async () => {
    setCsvPending(true);
    setCsvError(null);
    try {
      const blob = await downloadWholesaleReportCsv({ from, to });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wholesale-gst-${from}-to-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError((err as Error).message ?? "Failed to export CSV");
    } finally {
      setCsvPending(false);
    }
  };

  const hasRows = (report.data?.rows.length ?? 0) > 0;

  return (
    <div>
      <div className="mb-6 rounded-[var(--admin-r-lg)] border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-4">
        <div className="grid items-end gap-3 md:grid-cols-4">
          <Field label="From" htmlFor="wr-from">
            <TextInput id="wr-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To" htmlFor="wr-to">
            <TextInput id="wr-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => report.refetch()}>
            <FontAwesomeIcon icon={faRotate} />Refresh
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-[length:var(--admin-text-xs)] font-medium text-[var(--admin-ink-muted)]">Export:</span>
          <Button size="sm" onClick={handleCsv} disabled={csvPending || !hasRows} loading={csvPending}>
            <FontAwesomeIcon icon={faDownload} />CSV
          </Button>
          <Button size="sm" onClick={() => report.data && reportToExcel(report.data)} disabled={!hasRows}>
            <FontAwesomeIcon icon={faFileExcel} />Excel
          </Button>
          <Button size="sm" variant="danger" onClick={() => report.data && reportToPdf(report.data)} disabled={!hasRows}>
            <FontAwesomeIcon icon={faFilePdf} />PDF
          </Button>
        </div>
        {csvError && <p className="mt-2 text-[length:var(--admin-text-sm)] text-[var(--admin-error-fg)]">{csvError}</p>}
      </div>

      {report.data && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Invoices" value={report.data.totals.invoices} />
          <StatCard label="Taxable" value={Number(report.data.totals.taxableValue)} currency />
          <StatCard label="CGST" value={Number(report.data.totals.cgst)} currency />
          <StatCard label="SGST" value={Number(report.data.totals.sgst)} currency />
          <StatCard label="IGST" value={Number(report.data.totals.igst)} currency />
          <StatCard label="Total Sales" value={Number(report.data.totals.totalSales)} currency />
        </div>
      )}

      <DataTable
        columns={[
          { key: "invoice", header: "Invoice", render: (r) => <span className="font-mono text-[length:var(--admin-text-xs)]">{r.invoiceNumber}</span> },
          { key: "date", header: "Date", render: (r) => new Date(r.issuedAt).toLocaleDateString() },
          { key: "vendor", header: "Vendor", render: (r) => r.vendorName },
          { key: "gstin", header: "GSTIN", render: (r) => <span className="font-mono text-[length:var(--admin-text-xs)]">{r.gstin || "-"}</span> },
          { key: "taxable", header: "Taxable", render: (r) => asCurrency(r.taxableValue) },
          { key: "cgst", header: "CGST", render: (r) => asCurrency(r.cgst) },
          { key: "sgst", header: "SGST", render: (r) => asCurrency(r.sgst) },
          { key: "igst", header: "IGST", render: (r) => asCurrency(r.igst) },
          { key: "total", header: "Total", render: (r) => <span className="font-medium">{asCurrency(r.totalAmount)}</span> },
        ]}
        rows={hasRows ? report.data!.rows : []}
        rowKey={(r) => r.invoiceNumber}
        loading={report.isLoading}
        error={report.isError ? ((report.error as Error)?.message ?? "Failed to load report") : undefined}
        emptyIcon={faFileInvoiceDollar}
        emptyHeading="No wholesale invoices in this range"
        emptyMessage="Adjust the date range or create a wholesale order."
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminVendorsClient() {
  const router = useRouter();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [tab, setTab] = useState<"vendors" | "orders" | "report">("vendors");

  if (isLoading) {
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

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "vendors", label: "Vendors" },
    { key: "orders", label: "Wholesale Orders" },
    { key: "report", label: "GST Filing Report" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
        <PageHeader title="Vendors & Wholesale" breadcrumb="Admin / Vendors" />

        <div className="mb-6 flex gap-1 border-b border-[var(--admin-border)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-t-[var(--admin-r-md)] px-5 py-2.5 text-[length:var(--admin-text-sm)] font-medium transition-colors duration-[var(--admin-duration-occasional)] ${
                tab === t.key
                  ? "-mb-px border border-b-[var(--admin-card-bg)] border-[var(--admin-border)] bg-[var(--admin-card-bg)] text-[var(--admin-primary)]"
                  : "text-[var(--admin-ink-muted)] hover:text-[var(--admin-primary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "vendors" && <VendorsTab />}
        {tab === "orders" && <WholesaleInvoicesTab />}
        {tab === "report" && <ReportTab />}
      </div>
  );
}
