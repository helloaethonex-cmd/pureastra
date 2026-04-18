"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileInvoiceDollar,
  faDownload,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import {
  useAdminGstDetailed,
  useAdminGstSummary,
  useAdminOverviewReport,
  useDownloadAdminGstCsv,
  useIsAdmin,
} from "@/hooks/useAdmin";

const asCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function AdminReportsPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

  const [from, setFrom] = useState(isoDate(monthStart));
  const [to, setTo] = useState(isoDate(today));
  const [sort, setSort] = useState<"issuedAt:asc" | "issuedAt:desc">("issuedAt:desc");
  const [page, setPage] = useState(1);

  const overview = useAdminOverviewReport({ from, to });
  const summary = useAdminGstSummary({ from, to, sort });
  const detailed = useAdminGstDetailed({ from, to, sort, page, limit: 20 });
  const downloadCsv = useDownloadAdminGstCsv();

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

  const handleExportCsv = async (exportAll: boolean) => {
    try {
      const blob = await downloadCsv.mutateAsync({
        from,
        to,
        sort,
        page,
        limit: 20,
        exportAll,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gst-report-${from}-to-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // mutation error text is surfaced by React Query state
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
          <div className="w-10 h-10 rounded-full bg-[#5B8D7C] flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </div>
          <h1 className="text-2xl font-bold text-[#5E2B16] font-['Roboto',serif]">
            Reports
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6f665b] mb-1">GST Sort</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as "issuedAt:asc" | "issuedAt:desc");
                  setPage(1);
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="issuedAt:desc">Issued At Desc</option>
                <option value="issuedAt:asc">Issued At Asc</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  overview.refetch();
                  summary.refetch();
                  detailed.refetch();
                }}
                className="px-3 py-2 rounded-lg bg-[#9E6E5B] text-white text-sm hover:bg-[#8a5e4e] inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRotate} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv(false)}
                disabled={downloadCsv.isPending}
                className="px-3 py-2 rounded-lg bg-[#819744] text-white text-sm hover:bg-[#6d8039] disabled:opacity-50 inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                CSV (Page)
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv(true)}
                disabled={downloadCsv.isPending}
                className="px-3 py-2 rounded-lg bg-[#5B8D7C] text-white text-sm hover:bg-[#4a7466] disabled:opacity-50"
              >
                CSV (All)
              </button>
            </div>
          </div>
          {downloadCsv.isError ? (
            <p className="text-red-600 text-sm mt-3">
              {(downloadCsv.error as Error)?.message ?? "Failed to export CSV"}
            </p>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Revenue</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {asCurrency(overview.data?.totalRevenue ?? 0)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Profit</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {asCurrency(overview.data?.profit ?? 0)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-[#6f665b] uppercase">Influencer Commission</p>
            <p className="text-xl font-semibold text-[#5E2B16] mt-1">
              {asCurrency(overview.data?.influencerCommission ?? 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-[#5E2B16] mb-4">GST Summary</h2>
          {summary.isLoading ? (
            <p className="text-sm text-[#6f665b]">Loading GST summary...</p>
          ) : summary.isError ? (
            <p className="text-sm text-red-600">{(summary.error as Error)?.message ?? "Failed to load summary"}</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[#6f665b]">Total Invoices</p>
                <p className="text-[#5E2B16] font-semibold">{summary.data?.totalInvoices ?? 0}</p>
              </div>
              <div>
                <p className="text-[#6f665b]">Taxable Value</p>
                <p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalTaxableValue ?? 0)}</p>
              </div>
              <div>
                <p className="text-[#6f665b]">Total GST</p>
                <p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalGST ?? 0)}</p>
              </div>
              <div>
                <p className="text-[#6f665b]">CGST</p>
                <p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalCGST ?? 0)}</p>
              </div>
              <div>
                <p className="text-[#6f665b]">SGST</p>
                <p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalSGST ?? 0)}</p>
              </div>
              <div>
                <p className="text-[#6f665b]">IGST</p>
                <p className="text-[#5E2B16] font-semibold">{asCurrency(summary.data?.totalIGST ?? 0)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#5E2B16]">GST Detailed</h2>
            {detailed.data ? (
              <span className="text-xs text-[#6f665b]">
                Page {detailed.data.pagination.page} of {Math.max(detailed.data.pagination.totalPages, 1)}
              </span>
            ) : null}
          </div>

          <table className="w-full text-sm">
            <thead className="bg-[#F2ECDF] text-[#5E2B16]">
              <tr>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Issued</th>
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
                <tr>
                  <td className="px-4 py-4" colSpan={8}>Loading rows...</td>
                </tr>
              ) : detailed.isError ? (
                <tr>
                  <td className="px-4 py-4 text-red-600" colSpan={8}>
                    {(detailed.error as Error)?.message ?? "Failed to load rows"}
                  </td>
                </tr>
              ) : detailed.data?.rows.length ? (
                detailed.data.rows.map((row) => (
                  <tr key={`${row.invoiceNumber}-${row.issuedAt}`} className="border-t border-gray-100">
                    <td className="px-4 py-3">{row.invoiceNumber}</td>
                    <td className="px-4 py-3">{new Date(row.issuedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{row.customerState || "-"}</td>
                    <td className="px-4 py-3">{asCurrency(row.taxableValue)}</td>
                    <td className="px-4 py-3">{row.gstRate}%</td>
                    <td className="px-4 py-3">{asCurrency(row.cgst)}</td>
                    <td className="px-4 py-3">{asCurrency(row.sgst)}</td>
                    <td className="px-4 py-3">{asCurrency(row.igst)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4" colSpan={8}>No GST records found for this range.</td>
                </tr>
              )}
            </tbody>
          </table>

          {detailed.data ? (
            <div className="px-4 py-3 border-t border-gray-100 text-sm flex items-center justify-between">
              <div className="text-[#5E2B16]">
                Totals: Taxable {asCurrency(detailed.data.totals.taxableValue)} | CGST {asCurrency(detailed.data.totals.cgst)} | SGST {asCurrency(detailed.data.totals.sgst)} | IGST {asCurrency(detailed.data.totals.igst)}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={detailed.data.pagination.page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.max(detailed.data.pagination.totalPages, 1), p + 1),
                    )
                  }
                  disabled={
                    detailed.data.pagination.totalPages === 0 ||
                    detailed.data.pagination.page >= detailed.data.pagination.totalPages
                  }
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
