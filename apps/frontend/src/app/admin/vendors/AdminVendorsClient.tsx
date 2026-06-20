"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faStore,
  faPlus,
  faTrash,
  faPen,
  faXmark,
  faCheck,
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
  type WholesaleReportResponse,
} from "@/services/api";

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
    <div>
      <label className="block text-xs text-[#6f665b] mb-1">{label}</label>
      <input
        type={opts?.type ?? "text"}
        required={opts?.required}
        placeholder={opts?.placeholder}
        value={(form[key] as string) ?? ""}
        onChange={(e) => set(key, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#5E2B16]">
            {initial ? "Edit Vendor" : "Add Vendor"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2 text-sm bg-[#5E2B16] text-white rounded-lg hover:bg-[#4d2312] disabled:opacity-50 inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} />
              {isPending ? "Saving…" : initial ? "Update Vendor" : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vendors Tab ──────────────────────────────────────────────────────────────

function VendorsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const { data, isLoading, isError, error } = useVendors({ limit: 100 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6f665b]">Retailers and vendors you supply to wholesale.</p>
        <button type="button" onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#5E2B16] text-white text-sm rounded-lg hover:bg-[#4d2312] inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} />
          Add Vendor
        </button>
      </div>

      {(showForm || editing) && (
        <VendorForm initial={editing ?? undefined} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F2ECDF] text-[#5E2B16]">
            <tr>
              <th className="text-left px-4 py-3">Store</th>
              <th className="text-left px-4 py-3">GSTIN</th>
              <th className="text-left px-4 py-3">State</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-4 text-[#6f665b]">Loading…</td></tr>
            ) : isError ? (
              <tr><td colSpan={6} className="px-4 py-4 text-red-600">{(error as Error)?.message}</td></tr>
            ) : data?.rows.length ? (
              data.rows.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-[#5E2B16]">{v.storeName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.gstin || "-"}</td>
                  <td className="px-4 py-3">{v.state}</td>
                  <td className="px-4 py-3 text-xs">
                    {v.contactName || "-"}
                    {v.contactPhone ? <><br />{v.contactPhone}</> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => { setEditing(v); setShowForm(false); }}
                      className="text-[#819744] hover:text-[#5E2B16] text-xs inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faPen} />Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-4 py-4 text-[#6f665b]">No vendors yet. Add one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#5E2B16]">Create Wholesale Order</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">Vendor</label>
              <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="" disabled>Select a vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.storeName} ({v.state})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">Order / Invoice Date</label>
              <input type="date" required value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {selectedVendor && (
            <p className="text-xs text-[#6f665b] bg-[#FAF3E2] rounded-lg px-3 py-2">
              Billing <strong>{selectedVendor.storeName}</strong>
              {selectedVendor.gstin ? ` · GSTIN ${selectedVendor.gstin}` : ""} · {selectedVendor.state}.
              CGST/SGST vs IGST is determined automatically from the vendor&apos;s state.
            </p>
          )}

          {/* line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#6f665b] font-medium">Products</label>
              <button type="button" onClick={() => setItems((p) => [...p, emptyOrderLine()])}
                className="text-xs text-[#819744] hover:underline inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faPlus} />Add product
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_70px_110px_70px_90px_24px] gap-2 text-[10px] text-[#6f665b] px-1">
                <span>Product name</span>
                <span>Qty</span>
                <span>Unit ₹ (incl GST)</span>
                <span>GST %</span>
                <span>Line total</span>
                <span />
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_110px_70px_90px_24px] gap-2 items-center">
                  <input type="text" required placeholder="PureAstra Face Wash"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, "productName", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" required min="1" step="1" placeholder="30"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" required min="0" step="0.01" placeholder="80"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  <select value={item.gstRate}
                    onChange={(e) => updateItem(idx, "gstRate", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                  <span className="text-xs text-center text-[#5E2B16]">
                    {asCurrency(computed[idx].lineTotal)}
                  </span>
                  <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30">
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-sm grid grid-cols-3 gap-2 text-[#5E2B16]">
              <span>Taxable: {asCurrency(totalTaxable)}</span>
              <span>GST: {asCurrency(totalTax)}</span>
              <span className="font-semibold text-right">Total: {asCurrency(totalAmount)}</span>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={create.isPending || !vendorId}
              className="px-5 py-2 text-sm bg-[#5E2B16] text-white rounded-lg hover:bg-[#4d2312] disabled:opacity-50 inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} />
              {create.isPending ? "Generating…" : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6f665b]">Wholesale invoices. Download a PDF to send to the retailer.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => invoices.refetch()}
            className="px-3 py-2 rounded-lg bg-[#9E6E5B] text-white text-sm hover:bg-[#8a5e4e] inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faRotate} />Refresh
          </button>
          <button type="button" onClick={() => setShowForm(true)} disabled={vendorRows.length === 0}
            title={vendorRows.length === 0 ? "Add an active vendor first" : undefined}
            className="px-4 py-2 bg-[#5E2B16] text-white text-sm rounded-lg hover:bg-[#4d2312] disabled:opacity-50 inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} />New Order
          </button>
        </div>
      </div>

      {showForm && <WholesaleOrderForm vendors={vendorRows} onClose={() => setShowForm(false)} />}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F2ECDF] text-[#5E2B16]">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Vendor</th>
              <th className="text-left px-4 py-3">Taxable</th>
              <th className="text-left px-4 py-3">GST</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Invoice PDF</th>
            </tr>
          </thead>
          <tbody>
            {invoices.isLoading ? (
              <tr><td colSpan={8} className="px-4 py-4 text-[#6f665b]">Loading…</td></tr>
            ) : invoices.isError ? (
              <tr><td colSpan={8} className="px-4 py-4 text-red-600">{(invoices.error as Error)?.message}</td></tr>
            ) : invoices.data?.rows.length ? (
              invoices.data.rows.map((inv) => (
                <tr key={inv.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {inv.vendorName}
                    {inv.gstin ? <><br /><span className="text-[10px] text-[#6f665b] font-mono">{inv.gstin}</span></> : null}
                  </td>
                  <td className="px-4 py-3">{asCurrency(inv.taxableValue)}</td>
                  <td className="px-4 py-3">{asCurrency(inv.taxAmount)}</td>
                  <td className="px-4 py-3 font-medium">{asCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {inv.isInterstate
                      ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">IGST</span>
                      : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">CGST+SGST</span>}
                  </td>
                  <td className="px-4 py-3">
                    {inv.pdfStatus === 1 && inv.pdfUrl ? (
                      <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#C0392B] hover:underline text-xs inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faFilePdf} />Download
                      </a>
                    ) : inv.pdfStatus === 2 ? (
                      <button type="button" onClick={() => regenerate.mutate(inv.id)}
                        className="text-amber-600 hover:underline text-xs inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faRotate} />Retry
                      </button>
                    ) : (
                      <span className="text-[#6f665b] text-xs inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />Generating…
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-4 py-4 text-[#6f665b]">No wholesale invoices yet.</td></tr>
            )}
          </tbody>
        </table>

        {invoices.data && invoices.data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-[#6f665b]">
              Page {invoices.data.pagination.page} of {invoices.data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={invoices.data.pagination.page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
              <button type="button" onClick={() => setPage((p) => Math.min(invoices.data!.pagination.totalPages, p + 1))}
                disabled={invoices.data.pagination.page >= invoices.data.pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {invoices.data?.rows.some((r) => r.pdfStatus === 0) && (
        <p className="text-xs text-[#6f665b] mt-2">
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
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-[#6f665b] mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#6f665b] mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={() => report.refetch()}
            className="px-3 py-2 rounded-lg bg-[#9E6E5B] text-white text-sm hover:bg-[#8a5e4e] inline-flex items-center gap-2 justify-center">
            <FontAwesomeIcon icon={faRotate} />Refresh
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-[#6f665b] self-center font-medium">Export:</span>
          <button type="button" onClick={handleCsv} disabled={csvPending || !hasRows}
            className="px-3 py-1.5 rounded-lg bg-[#819744] text-white text-xs hover:bg-[#6d8039] disabled:opacity-50 inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faDownload} />CSV
          </button>
          <button type="button" onClick={() => report.data && reportToExcel(report.data)} disabled={!hasRows}
            className="px-3 py-1.5 rounded-lg bg-[#1E8449] text-white text-xs hover:bg-[#196f3d] disabled:opacity-50 inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faFileExcel} />Excel
          </button>
          <button type="button" onClick={() => report.data && reportToPdf(report.data)} disabled={!hasRows}
            className="px-3 py-1.5 rounded-lg bg-[#C0392B] text-white text-xs hover:bg-[#a93226] disabled:opacity-50 inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faFilePdf} />PDF
          </button>
        </div>
        {csvError && <p className="text-red-600 text-sm mt-2">{csvError}</p>}
      </div>

      {report.data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Invoices", value: String(report.data.totals.invoices) },
            { label: "Taxable", value: asCurrency(report.data.totals.taxableValue) },
            { label: "CGST", value: asCurrency(report.data.totals.cgst) },
            { label: "SGST", value: asCurrency(report.data.totals.sgst) },
            { label: "IGST", value: asCurrency(report.data.totals.igst) },
            { label: "Total Sales", value: asCurrency(report.data.totals.totalSales) },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] text-[#6f665b] uppercase">{c.label}</p>
              <p className="text-sm font-semibold text-[#5E2B16] mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F2ECDF] text-[#5E2B16]">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Vendor</th>
              <th className="text-left px-4 py-3">GSTIN</th>
              <th className="text-left px-4 py-3">Taxable</th>
              <th className="text-left px-4 py-3">CGST</th>
              <th className="text-left px-4 py-3">SGST</th>
              <th className="text-left px-4 py-3">IGST</th>
              <th className="text-left px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {report.isLoading ? (
              <tr><td colSpan={9} className="px-4 py-4 text-[#6f665b]">Loading…</td></tr>
            ) : report.isError ? (
              <tr><td colSpan={9} className="px-4 py-4 text-red-600">{(report.error as Error)?.message}</td></tr>
            ) : hasRows ? (
              report.data!.rows.map((r) => (
                <tr key={r.invoiceNumber} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{r.invoiceNumber}</td>
                  <td className="px-4 py-3">{new Date(r.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.vendorName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.gstin || "-"}</td>
                  <td className="px-4 py-3">{asCurrency(r.taxableValue)}</td>
                  <td className="px-4 py-3">{asCurrency(r.cgst)}</td>
                  <td className="px-4 py-3">{asCurrency(r.sgst)}</td>
                  <td className="px-4 py-3">{asCurrency(r.igst)}</td>
                  <td className="px-4 py-3 font-medium">{asCurrency(r.totalAmount)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9} className="px-4 py-4 text-[#6f665b]">No wholesale invoices in this range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
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
      <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">
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
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin"
          className="inline-flex items-center gap-2 text-[#819744] hover:text-[#5E2B16] mb-8 transition text-sm font-medium">
          <FontAwesomeIcon icon={faArrowLeft} />Back to Admin
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#5B8D7C] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faStore} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">Vendors &amp; Wholesale</h1>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${
                tab === t.key
                  ? "bg-white border border-b-white border-gray-200 text-[#5E2B16] -mb-px"
                  : "text-[#6f665b] hover:text-[#5E2B16]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "vendors" && <VendorsTab />}
        {tab === "orders" && <WholesaleInvoicesTab />}
        {tab === "report" && <ReportTab />}
      </div>
    </section>
  );
}
