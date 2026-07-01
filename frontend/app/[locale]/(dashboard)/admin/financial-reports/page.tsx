import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import FinancialReportsClient, { type FinancialReportsData } from "./_components/FinancialReportsClient";

export const metadata: Metadata = {
  title: "Financial Reports | ARES Admin",
  description: "View and analyze financial metrics, supplier earnings, and booking summary reports.",
};

export default async function FinancialReportsPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  let initialData: FinancialReportsData | null = null;

  try {
    // Default call to get last 30 days financial report overview
    initialData = await apiFetchJson<FinancialReportsData>(`/api/dashboard/financial-reports`, {
      method: "GET",
      accessToken: session.accessToken,
    });
  } catch (error) {
    logger.error("Failed to fetch initial financial reports on server side", error);
  }

  return <FinancialReportsClient initialData={initialData} accessToken={session.accessToken} locale={locale} />;
}
