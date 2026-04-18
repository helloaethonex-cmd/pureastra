import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFAED] flex items-center justify-center">
          <div className="text-[#8FA64C] text-lg font-medium animate-pulse">
            Verifying…
          </div>
        </div>
      }
    >
      <VerifyEmailPage />
    </Suspense>
  );
}
