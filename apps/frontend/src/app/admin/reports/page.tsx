import { requireAdmin } from "@/services/server-auth";
import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();
  return <AdminReportsClient />;
}
