import { redirect } from "next/navigation";

export default function ActiveTripsRedirect() {
  redirect("/admin/trips");
}
