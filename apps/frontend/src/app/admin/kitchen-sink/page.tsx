import { notFound } from "next/navigation";
import { KitchenSinkClient } from "./KitchenSinkClient";

export const dynamic = "force-dynamic";

/**
 * Dev-only preview of the Phase 0 component library. Not linked from any nav.
 * Next.js treats `_`-prefixed folders as private/unrouted, so this route intentionally
 * has no underscore — production-gating happens here instead.
 */
export default function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitchenSinkClient />;
}
