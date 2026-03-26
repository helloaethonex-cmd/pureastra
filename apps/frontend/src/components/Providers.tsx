"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "@/hooks/useAuth";
import { useState } from "react";

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
      <SessionHydrator>{children}</SessionHydrator>
    </QueryClientProvider>
  );
}
