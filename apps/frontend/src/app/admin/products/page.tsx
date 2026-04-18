import { requireAdmin } from "@/services/server-auth";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  return <AdminProductsClient />;
}
