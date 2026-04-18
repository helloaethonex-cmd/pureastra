import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF3E2] flex items-center justify-center text-[#5E2B16]">
          Loading login...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
