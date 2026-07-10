import { AdminShellClient } from "./_components/AdminShellClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}
