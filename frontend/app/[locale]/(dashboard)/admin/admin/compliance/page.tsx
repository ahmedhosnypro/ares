import { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import ComplianceView from "./ComplianceView";

export const metadata: Metadata = {
  title: "PCI DSS Compliance Center | ARES Car Rental",
  description: "Monitor PCI DSS compliance, vulnerability scans, self-assessments, and security reports.",
};

export default async function AdminCompliancePage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  return <ComplianceView />;
}
