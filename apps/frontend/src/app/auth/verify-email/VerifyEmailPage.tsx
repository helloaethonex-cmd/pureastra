"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setErrorMsg("Invalid verification link — no token found.");
      setStatus("error");
      return;
    }

    authClient.verifyEmail({ query: { token } }).then((result) => {
      if (result.error) {
        setErrorMsg(
          result.error.message ?? "Verification failed. The link may have expired."
        );
        setStatus("error");
      } else {
        setStatus("success");
        // Auto-redirect to home after 3s
        setTimeout(() => router.push("/"), 3000);
      }
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#FFFAED] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Top accent strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#8FA64C] to-[#5e6d2f]" />

        <div className="p-10 flex flex-col items-center text-center gap-5">

          {/* ── LOADING ── */}
          {status === "loading" && (
            <>
              <FontAwesomeIcon
                icon={faSpinner}
                className="text-5xl text-[#8FA64C] animate-spin"
              />
              <h1 className="text-2xl font-semibold text-[#5e6d2f]">
                Verifying your email…
              </h1>
              <p className="text-sm text-gray-500">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#eef3da] flex items-center justify-center animate-[fadeIn_0.4s_ease]">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-4xl text-[#8FA64C]"
                />
              </div>
              <h1 className="text-2xl font-semibold text-[#5e6d2f]">
                Email Verified!
              </h1>
              <p className="text-sm text-gray-500">
                Your email has been successfully verified. You can now log in.
              </p>
              <p className="text-xs text-gray-400">
                Redirecting to home in 3 seconds…
              </p>
              <Link
                href="/"
                className="mt-2 w-full bg-[#8FA64C] text-white py-3 rounded-full text-sm font-semibold hover:bg-[#7a923f] transition text-center"
              >
                Go to Home
              </Link>
            </>
          )}

          {/* ── ERROR ── */}
          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center animate-[fadeIn_0.4s_ease]">
                <FontAwesomeIcon
                  icon={faCircleXmark}
                  className="text-4xl text-red-400"
                />
              </div>
              <h1 className="text-2xl font-semibold text-[#5e6d2f]">
                Verification Failed
              </h1>
              <p className="text-sm text-gray-500">{errorMsg}</p>
              <Link
                href="/"
                className="mt-2 w-full bg-[#8FA64C] text-white py-3 rounded-full text-sm font-semibold hover:bg-[#7a923f] transition text-center"
              >
                Back to Home
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
