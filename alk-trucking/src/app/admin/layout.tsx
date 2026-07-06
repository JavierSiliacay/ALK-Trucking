import AdminShell from "@/components/layout/AdminShell";
import { adminConfig } from "@/config/admin-config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // NOTE: Auth guard is temporarily disabled for UI preview.
  // Restore the auth() check before database integration phase.
  return <AdminShell>{children}</AdminShell>;
}
