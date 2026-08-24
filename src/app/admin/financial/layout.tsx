import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FINANCIAL_AUTHORIZED_EMAILS } from "@/config/permissions";

export default async function FinancialLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If no session, or user has no email, or email is not in the whitelist -> Kick them out
  if (!session?.user?.email || !FINANCIAL_AUTHORIZED_EMAILS.includes(session.user.email.toLowerCase())) {
    redirect("/admin"); // Redirect unauthorized users to dashboard
  }

  return <>{children}</>;
}
