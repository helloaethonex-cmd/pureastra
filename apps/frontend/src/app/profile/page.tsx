"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useMyProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useAuth";

const profileField = (label: string, value?: string | null) => ({
  label,
  value: value?.trim() || "-",
});

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const signOut = useSignOut();
  const { data: profile, isLoading, isError, error } = useMyProfile(Boolean(user));

  const fields = [
    profileField("First Name", profile?.firstName),
    profileField("Last Name", profile?.lastName),
    profileField("Name", profile?.name),
    profileField("Email", profile?.email),
    profileField("Contact Number", profile?.phone),
    profileField("Role", profile?.role?.name),
  ];

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16">

      <div className="w-[1144px] mx-auto flex items-end justify-between">

        {/* ================= LEFT FORM ================= */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[762px] h-[565px] bg-[#EDE3D2] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >

          {authLoading || (user && isLoading) ? (
            <div className="h-full flex items-center justify-center text-[#5E2B16] text-lg">
              Loading profile...
            </div>
          ) : !user ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#5E2B16] gap-4">
              <p className="text-xl">Please sign in to access your profile.</p>
              <Link
                href="/"
                className="bg-[#9A5F2D] text-white px-8 py-3 rounded-full text-base font-['Poppins',serif] hover:opacity-90 transition"
              >
                Go to Home
              </Link>
            </div>
          ) : isError ? (
            <div className="h-full flex items-center justify-center text-red-600 text-lg text-center px-8">
              {(error as Error)?.message ?? "Failed to load profile"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 text-[#5E2B16] text-sm">
              {fields.map((field) => (
                <div key={field.label} className={field.label === "Email" ? "col-span-2" : ""}>
                  <p className="font-['Poppins',serif] text-[16px] text-[#5E2B15]">{field.label}</p>
                  <div className="w-full mt-1 p-2 rounded-md bg-white/80 border border-[#d7c8b2] min-h-10">
                    {field.value}
                  </div>
                </div>
              ))}

              <div className="col-span-2 mt-4 text-sm text-[#6d4b37]">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
              </div>
            </div>
          )}

        </motion.div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-[382px] h-[620px] bg-[#5E2B15] text-white shadow-xl flex flex-col -ml-6"
        >

          {/* TOP LEFT CUT */}
            <div className="absolute -top-0 -left-[60px] w-0 h-0 
            border-l-[60px] border-l-transparent 
            border-b-[60px] border-b-[#5E2B15]" />

            {/* BOTTOM LEFT CUT */}
            <div className="absolute -bottom-0 -left-[60px] w-0 h-0 
            border-l-[60px] border-l-transparent 
            border-t-[60px] border-t-[#5E2B15]" />

          {/* HEADER */}
          <div className="bg-[#4E2716] text-center py-6 text-[20px] font-semibold border-b border-white/20">
            Profile
          </div>

          {/* MENU */}
            <div className="flex flex-col flex-1 justify-around text-center text-[20px]">
            {[
                { name: "Order Track", href: "/order-track" },
                { name: "Order History", href: "/order-history" },
                { name: "Cart", href: "/cart" },
            ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="py-6 border-b border-white/20 hover:bg-[#4a1f0f] transition cursor-pointer"
                >
                    {item.name}
                </Link>
            ))}

            <button
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