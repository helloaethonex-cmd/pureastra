"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin, useAdminOverviewReport, useAdminInfluencerAnalytics } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth.store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { PageHeader, StatCard, DateInput, Field } from "./_components";
import { staggerContainerVariants, staggerItemVariants } from "./_components/motion";
import { motion, useReducedMotion } from "framer-motion";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const reduceMotion = useReducedMotion() ?? false;

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const [from, setFrom] = useState(isoDate(monthStart));
  const [to, setTo] = useState(isoDate(today));

  const overview = useAdminOverviewReport({ from, to });
  const influencerAnalytics = useAdminInfluencerAnalytics({ startDate: from, endDate: to });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-[#5E2B16] text-lg font-semibold animate-pulse">Verifying access…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <FontAwesomeIcon icon={faLock} className="text-[#5E2B16] text-5xl" />
        <p className="text-[#5E2B16] text-xl font-semibold">Access Denied</p>
      </div>
    );
  }

  const loading = overview.isLoading || influencerAnalytics.isLoading;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        breadcrumb={user ? `Logged in as ${user.email}` : undefined}
        actions={
          <div className="flex items-end gap-3">
            <Field label="From" htmlFor="dash-from">
              <DateInput id="dash-from" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" htmlFor="dash-to">
              <DateInput id="dash-to" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        }
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerVariants(reduceMotion)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Total Revenue"
            value={loading ? 0 : Number(overview.data?.totalRevenue ?? 0)}
            currency
            loading={loading}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Profit"
            value={loading ? 0 : Number(overview.data?.profit ?? 0)}
            currency
            loading={loading}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Influencer Commission"
            value={loading ? 0 : Number(overview.data?.influencerCommission ?? 0)}
            currency
            loading={loading}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Influencers (active / paused)"
            value={
              loading
                ? 0
                : `${influencerAnalytics.data?.influencers.active ?? 0} / ${influencerAnalytics.data?.influencers.paused ?? 0}`
            }
            loading={loading}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Commission Issued"
            value={loading ? 0 : Number(influencerAnalytics.data?.revenue.totalCommissionIssued ?? 0)}
            currency
            loading={loading}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reduceMotion)}>
          <StatCard
            label="Influenced Revenue"
            value={loading ? 0 : Number(influencerAnalytics.data?.revenue.totalInfluencedOrderValue ?? 0)}
            currency
            loading={loading}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
