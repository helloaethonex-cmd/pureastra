"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuthStore } from "@/store/auth.store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faBoxOpen,
  faTruck,
  faLock,
  faChartLine,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center">
        <div className="text-[#5E2B16] text-lg font-semibold animate-pulse">
          Verifying access…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF3E2] flex flex-col items-center justify-center gap-4">
        <FontAwesomeIcon icon={faLock} className="text-[#5E2B16] text-5xl" />
        <p className="text-[#5E2B16] text-xl font-semibold">Access Denied</p>
      </div>
    );
  }

  const cards = [
    {
      icon: faLayerGroup,
      title: "Manage Categories",
      desc: "View, create, edit and delete product categories",
      href: "/admin/categories",
      bg: "bg-[#EBF1DC]",
      accent: "#819744",
    },
    {
      icon: faBoxOpen,
      title: "Manage Products",
      desc: "View, create, edit products with variants and images",
      href: "/admin/products",
      bg: "bg-[#EDE3D2]",
      accent: "#9E6E5B",
    },
    {
      icon: faTruck,
      title: "Manage Orders",
      desc: "Track placed orders and advance fulfillment statuses",
      href: "/admin/orders",
      bg: "bg-[#E8F0EC]",
      accent: "#5B8D7C",
    },
    {
      icon: faChartLine,
      title: "Reports",
      desc: "GST and overview financial reports with CSV export",
      href: "/admin/reports",
      bg: "bg-[#EAF2F0]",
      accent: "#4A7466",
    },
    {
      icon: faUsers,
      title: "Influencers",
      desc: "Manage influencer accounts, analytics and payouts",
      href: "/admin/influencers",
      bg: "bg-[#EEF0F8]",
      accent: "#6C79A8",
    },
  ];

  return (
    <section className="min-h-screen bg-[#FAF3E2] px-6 md:px-12 py-14">
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <p className="text-sm text-[#819744] font-semibold uppercase tracking-widest mb-2">
          Admin
        </p>
        <h1 className="text-[38px] font-bold text-[#5E2B16] font-['Roboto',serif]">
          Admin Panel
        </h1>
        {user && (
          <p className="text-gray-500 mt-2 text-sm">
            Logged in as <span className="font-semibold">{user.email}</span>
          </p>
        )}
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group ${card.bg} rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-sm border border-transparent hover:border-[#cfc7b8] hover:-translate-y-1 transition-all duration-300`}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow"
              style={{ backgroundColor: card.accent }}
            >
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <h2 className="font-bold text-[#5E2B16] text-lg">{card.title}</h2>
            <p className="text-[#7A736A] text-sm leading-relaxed">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
