import { requireAdmin } from "@/services/server-auth";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  return <AdminOrdersClient />;
}
