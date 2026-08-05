import AdminShell from "@/components/layout/AdminShell";
import { adminConfig } from "@/config/admin-config";
import { getTrips } from "@/actions/trips";
import { getMasterData } from "@/actions/master";
import { TripsProvider } from "@/lib/trips-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // NOTE: Auth guard is temporarily disabled for UI preview.
  // Restore the auth() check before database integration phase.
  
  // Fetch data on the server to completely eliminate loading spinners
  const dbTrips = await getTrips();
  const dbMasterData = await getMasterData();

  return (
    <TripsProvider initialTrips={dbTrips} initialMasterData={dbMasterData}>
      <AdminShell>{children}</AdminShell>
    </TripsProvider>
  );
}
