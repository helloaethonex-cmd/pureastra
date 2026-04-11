"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/hooks/useAuth";
import { Suspense, useState } from "react";
import ReferralAttributionHydrator from "@/components/ReferralAttributionHydrator";

function SessionHydrator({ children }: { children: React.ReactNode }) {
  useSession();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionHydrator>
        <Suspense fallback={null}>
          <ReferralAttributionHydrator />
        </Suspense>
        {children}
      </SessionHydrator>
    </QueryClientProvider>
  );
}
