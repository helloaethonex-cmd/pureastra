"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { useAuthStore } from "@/store/auth.store";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);
  const { user, isLoading } = useAuthStore();
  const next = searchParams.get("next") || "/";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next);
    }
  }, [isLoading, next, router, user]);

  return (
    <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center px-6">
      <div className="max-w-md text-center text-[#5E2B16]">
        <h1 className="text-2xl font-semibold mb-3">Sign in to continue</h1>
        <p className="text-sm text-[#7B6A58] mb-5">
          Your account keeps checkout, orders, wishlist, and profile details
          secure.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="bg-[#819744] text-white px-6 py-2.5 rounded-md font-semibold"
        >
          Open Login
        </button>
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
