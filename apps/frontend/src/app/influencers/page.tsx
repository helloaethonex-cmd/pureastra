"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import { useMyInfluencerDashboard } from "@/hooks/useInfluencers";
import { useSignOut } from "@/hooks/useAuth";

const money = (value: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const saleStatusClass = (status: string) => {
  if (status === "PAID") return "bg-[#DCE9D8] text-[#2E7D32]";
  if (status === "APPROVED") return "bg-[#E8F0FA] text-[#16589C]";
  if (status === "CANCELLED") return "bg-[#FDE8E8] text-[#B42318]";
  return "bg-[#FFF1D6] text-[#9A5F2D]";
};

export default function InfluencersPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const signOut = useSignOut();
  const { data, isLoading, isError, error } = useMyInfluencerDashboard(Boolean(user));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const shareLink = useMemo(() => {
    if (!data) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://pureastra.com";
    return `${origin}/?ref=${encodeURIComponent(data.influencer.referralCode)}`;
  }, [data]);

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const errorMessage = (error as Error | undefined)?.message ?? "Failed to load dashboard";
  const isAccessIssue =
    errorMessage.toLowerCase().includes("dashboard access") ||
    errorMessage.toLowerCase().includes("no influencer account linked");

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16">
      <div className="w-[1144px] mx-auto flex items-end justify-between">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[762px] h-[565px] bg-[#EDE3D2] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >
          {authLoading || (user && isLoading) ? (
            <div className="h-full flex items-center justify-center text-[#5E2B16] text-lg gap-3">
              <FontAwesomeIcon icon={faSpinner} spin className="text-[#819744]" />
              Loading influencer dashboard...
            </div>
          ) : !user ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#5E2B16] gap-4">
              <p className="text-xl">Please sign in to access your influencer dashboard.</p>
              <Link
                href="/"
                className="bg-[#9A5F2D] text-white px-8 py-3 rounded-full text-base font-['Poppins',serif] hover:opacity-90 transition"
              >
                Go to Home
              </Link>
            </div>
          ) : isError || !data ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-[#5E2B16]">
              <p className="text-xl font-semibold mb-2">Influencer Dashboard</p>
              <p className="text-base text-[#6d4b37]">
                {isAccessIssue
                  ? "Dashboard access is not enabled for this account yet. Please contact support or an admin."
                  : errorMessage}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-[#D6C9B6] pb-4 mb-4">
                <div>
                  <p className="text-[24px] text-[#5E2B15] font-semibold">Influencer Dashboard</p>
                  <p className="text-sm text-[#6d4b37]">Welcome back, {data.influencer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-[#7B6A58]">Referral Code</p>
                  <p className="text-2xl text-[#5E2B15] font-bold leading-none mt-1">
                    {data.influencer.referralCode}
                  </p>
                  <p className="text-xs text-[#7B6A58] mt-1">
                    {Number(data.influencer.commissionRate).toFixed(2)}% commission
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-[#5E2B16] text-sm">
                <div className="bg-white/80 border border-[#d7c8b2] p-3 rounded-md">
                  <p className="text-xs text-[#7B6A58] uppercase tracking-wide">Total Earnings</p>
                  <p className="text-[22px] font-semibold text-[#2E7D32] mt-1">{money(data.earnings.total)}</p>
                </div>
                <div className="bg-white/80 border border-[#d7c8b2] p-3 rounded-md">
                  <p className="text-xs text-[#7B6A58] uppercase tracking-wide">Pending + Approved</p>
                  <p className="text-[22px] font-semibold text-[#5E2B15] mt-1">
                    {money((Number(data.earnings.pending) + Number(data.earnings.approved)).toFixed(2))}
                  </p>
                </div>
                <div className="bg-white/80 border border-[#d7c8b2] p-3 rounded-md">
                  <p className="text-xs text-[#7B6A58] uppercase tracking-wide">Total Orders</p>
                  <p className="text-[22px] font-semibold text-[#5E2B15] mt-1">{data.orders.total}</p>
                </div>
                <div className="bg-white/80 border border-[#d7c8b2] p-3 rounded-md">
                  <p className="text-xs text-[#7B6A58] uppercase tracking-wide">Paid Orders</p>
                  <p className="text-[22px] font-semibold text-[#5E2B15] mt-1">{data.orders.paid}</p>
                </div>
              </div>

              <div className="bg-white/80 border border-[#d7c8b2] p-3 rounded-md mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#7B6A58] uppercase tracking-wide">Share Link</p>
                    <p className="text-sm text-[#5E2B15] truncate">{shareLink}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 bg-[#5E2B15] text-white text-xs px-3 py-2 rounded-md hover:bg-[#4a200f] transition inline-flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[16px] text-[#5E2B15] font-semibold">Recent Sales</p>
                </div>
                {data.recentSales.length === 0 ? (
                  <div className="bg-white/80 border border-[#d7c8b2] rounded-md p-4 text-sm text-[#6d4b37]">
                    No sales attributed yet.
                  </div>
                ) : (
                  <div className="bg-white/80 border border-[#d7c8b2] rounded-md max-h-[188px] overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[#7B6A58] text-xs uppercase">
                        <tr className="border-b border-[#e7dbc8]">
                          <th className="px-3 py-2 font-medium">Order</th>
                          <th className="px-3 py-2 font-medium">Commission</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentSales.map((sale) => (
                          <tr key={sale.id} className="border-b border-[#f2e8d8] last:border-0">
                            <td className="px-3 py-2 text-[#5E2B15]">{sale.orderNumber}</td>
                            <td className="px-3 py-2 text-[#2E7D32] font-semibold">
                              {money(sale.commissionAmount)}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${saleStatusClass(sale.status)}`}>
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-[382px] h-[620px] bg-[#5E2B15] text-white shadow-xl flex flex-col -ml-6"
        >
          <div className="absolute -top-0 -left-[60px] w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-[#5E2B15]" />
          <div className="absolute -bottom-0 -left-[60px] w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-[#5E2B15]" />

          <Link href="/profile">
            <div className="bg-[#4E2716] text-center py-6 text-[20px] font-semibold border-b border-white/20">
              Profile
            </div>
          </Link>

          <div className="flex flex-col flex-1 justify-around text-center text-[20px]">
            {[
              { name: "Order Track", href: "/order-track" },
              { name: "Order History", href: "/order-history" },
              { name: "Influencer Dashboard", href: "/influencers" },
              { name: "Cart", href: "/cart" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`py-6 border-b border-white/20 transition cursor-pointer ${
                  item.href === "/influencers" ? "bg-[#4a1f0f]" : "hover:bg-[#4a1f0f]"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => signOut.mutate()}
              className="py-6 border-b border-white/20 hover:bg-[#4a1f0f] transition cursor-pointer"
            >
              {signOut.isPending ? "Logging out..." : "Log out"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
