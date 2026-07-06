"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faPenToSquare,
  faCheck,
  faTimes,
  faUser,
  faEnvelope,
  faPhone,
  faShoppingBag,
  faHeart,
  faClockRotateLeft,
  faMapLocationDot,
  faArrowRightFromBracket,
  faCircleNotch,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useAuth";
import { useRequireClientSession } from "@/hooks/useRequireClientSession";

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(profile: { firstName?: string | null; lastName?: string | null; name?: string | null; email: string }) {
  if (profile.firstName && profile.lastName)
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  if (profile.name) return profile.name.slice(0, 2).toUpperCase();
  return profile.email.slice(0, 2).toUpperCase();
}

// ─── Field row ───────────────────────────────────────────────────────────────

function FieldRow({
  label,
  icon,
  value,
  editing,
  editValue,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  label: string;
  icon: IconDefinition;
  value?: string | null;
  editing: boolean;
  editValue: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#9E6E5B] uppercase tracking-wide flex items-center gap-1.5">
        <FontAwesomeIcon icon={icon} size="xs" />
        {label}
      </label>
      {editing && !readOnly ? (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          className="w-full px-3 py-2.5 rounded-xl border-2 border-[#9E6E5B]/30 bg-white focus:border-[#9E6E5B] focus:outline-none text-sm text-[#3d1f0e] transition"
        />
      ) : (
        <div className="px-3 py-2.5 rounded-xl bg-white/70 border border-[#d7c8b2] text-sm text-[#3d1f0e] min-h-[42px] flex items-center">
          {value?.trim() || <span className="text-gray-400 italic">Not set</span>}
        </div>
      )}
    </div>
  );
}

// ─── Nav link ────────────────────────────────────────────────────────────────

function NavItem({ href, icon, label }: { href: string; icon: IconDefinition; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-[#5E2B15]/10 transition group"
    >
      <div className="flex items-center gap-3 text-[#5E2B15]">
        <div className="w-8 h-8 rounded-lg bg-[#9E6E5B]/15 flex items-center justify-center">
          <FontAwesomeIcon icon={icon} size="sm" className="text-[#9E6E5B]" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <FontAwesomeIcon icon={faChevronRight} size="xs" className="text-[#9E6E5B]/50 group-hover:text-[#9E6E5B] transition" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  useRequireClientSession();
  const { user, isLoading: authLoading } = useAuthStore();
  const signOut = useSignOut();
  const { data: profile, isLoading, isError, error } = useMyProfile(Boolean(user));
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    name: "",
    phone: "",
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs edit form fields whenever profile data changes (e.g. after save)
      setForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        name: profile.name ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        name: form.name || undefined,
        phone: form.phone || undefined,
      });
      setEditing(false);
      setToast({ type: "success", msg: "Profile updated!" });
    } catch (err) {
      setToast({ type: "error", msg: (err instanceof Error ? err.message : undefined) ?? "Failed to update profile" });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        name: profile.name ?? "",
        phone: profile.phone ?? "",
      });
    }
    setEditing(false);
  };

  const navItems = [
    { href: "/order-history", icon: faClockRotateLeft, label: "Order History" },
    { href: "/order-track", icon: faMapLocationDot, label: "Track Order" },
    { href: "/wishlist", icon: faHeart, label: "Wishlist" },
    { href: "/cart", icon: faShoppingBag, label: "Cart" },
    { href: "/influencers", icon: faUser, label: "Influencer Dashboard" },
  ];

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-8 px-4 sm:px-6 lg:px-8">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-5 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
              toast.type === "success" ? "bg-[#4a7c43]" : "bg-red-600"
            }`}
          >
            <FontAwesomeIcon icon={toast.type === "success" ? faCheck : faTimes} size="sm" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">

        {/* Page title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#5E2B15] mb-6 font-['Marko_One']">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Profile card ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {authLoading || (user && isLoading) ? (
              <div className="bg-[#EDE3D2] rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-[#9E6E5B] text-2xl" />
              </div>
            ) : !user ? (
              <div className="bg-[#EDE3D2] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
                <p className="text-[#5E2B15] text-lg font-medium">Please sign in to view your profile.</p>
                <Link href="/" className="bg-[#9A5F2D] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition">
                  Go to Home
                </Link>
              </div>
            ) : isError ? (
              <div className="bg-[#EDE3D2] rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                <p className="text-red-600 text-center">{(error as Error)?.message ?? "Failed to load profile"}</p>
              </div>
            ) : profile ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#EDE3D2] rounded-2xl shadow-sm p-5 sm:p-7"
              >
                {/* Profile header */}
                <div className="flex items-start justify-between mb-6 gap-3">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#5E2B15] text-white flex items-center justify-center text-xl font-bold flex-none shadow">
                      {initials(profile)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-[#3d1f0e] truncate">
                        {profile.name ?? profile.email}
                      </h2>
                      <p className="text-xs text-[#9E6E5B] font-medium mt-0.5">
                        {profile.role?.name ?? "Customer"}
                      </p>
                      <p className="text-xs text-[#9E6E5B]/70 mt-0.5">
                        Member since {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Edit / Save / Cancel buttons */}
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex-none flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#9E6E5B]/15 hover:bg-[#9E6E5B]/25 text-[#5E2B15] text-sm font-medium transition"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} size="sm" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2 flex-none">
                      <button
                        onClick={handleSave}
                        disabled={updateProfile.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5E2B15] text-white text-sm font-medium hover:bg-[#4a1f0f] transition disabled:opacity-60"
                      >
                        {updateProfile.isPending
                          ? <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" size="sm" />
                          : <FontAwesomeIcon icon={faCheck} size="sm" />}
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm transition"
                      >
                        <FontAwesomeIcon icon={faTimes} size="sm" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldRow
                    label="First Name"
                    icon={faUser}
                    value={profile.firstName}
                    editing={editing}
                    editValue={form.firstName}
                    onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                    placeholder="First name"
                  />
                  <FieldRow
                    label="Last Name"
                    icon={faUser}
                    value={profile.lastName}
                    editing={editing}
                    editValue={form.lastName}
                    onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                    placeholder="Last name"
                  />
                  <FieldRow
                    label="Display Name"
                    icon={faUser}
                    value={profile.name}
                    editing={editing}
                    editValue={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    placeholder="Display name"
                  />
                  <FieldRow
                    label="Phone"
                    icon={faPhone}
                    value={profile.phone}
                    editing={editing}
                    editValue={form.phone}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    placeholder="+91 XXXXX XXXXX"
                    type="tel"
                  />
                  <div className="sm:col-span-2">
                    <FieldRow
                      label="Email"
                      icon={faEnvelope}
                      value={profile.email}
                      editing={editing}
                      editValue={profile.email}
                      onChange={() => {}}
                      readOnly
                    />
                    {editing && (
                      <p className="text-[11px] text-[#9E6E5B]/70 mt-1 ml-1">
                        Email cannot be changed here.
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 mt-5 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${profile.emailVerified ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                    {profile.emailVerified ? "✓ Email verified" : "Email unverified"}
                  </span>
                  {profile.phoneVerified && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Phone verified
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${profile.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* ── RIGHT: Sidebar nav ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            {/* Navigation */}
            <div className="bg-[#EDE3D2] rounded-2xl shadow-sm p-4">
              <p className="text-xs font-semibold text-[#9E6E5B] uppercase tracking-wide mb-3 px-1">
                Quick Links
              </p>
              <div className="flex flex-col gap-0.5">
                {navItems.map((item) => (
                  <NavItem key={item.href} {...item} />
                ))}
              </div>
            </div>

            {/* Sign out */}
            <div className="bg-[#EDE3D2] rounded-2xl shadow-sm p-4">
              <button
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition group disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={signOut.isPending ? faCircleNotch : faArrowRightFromBracket} size="sm" className={signOut.isPending ? "animate-spin text-red-400" : "text-red-500"} />
                  </div>
                  <span className="text-sm font-medium">
                    {signOut.isPending ? "Logging out…" : "Log out"}
                  </span>
                </div>
                <FontAwesomeIcon icon={faChevronRight} size="xs" className="text-red-400/50 group-hover:text-red-400 transition" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
