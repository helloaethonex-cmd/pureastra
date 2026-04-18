import { requireAdmin } from "@/services/server-auth";
import AdminInfluencersClient from "./AdminInfluencersClient";

export const dynamic = "force-dynamic";

export default async function AdminInfluencersPage() {
  await requireAdmin();
  return <AdminInfluencersClient />;
}
