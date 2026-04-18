import { requireAdmin } from "@/services/server-auth";
import AdminCategoriesClient from "./AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  return <AdminCategoriesClient />;
}
