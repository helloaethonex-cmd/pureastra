import { requireAdmin } from "@/services/server-auth";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminClient />;
}
