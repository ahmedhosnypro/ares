import { getTranslations } from "next-intl/server";
import DriverDashboardClient from "./DriverDashboardClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.driverDashboard" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DriverDashboardPage() {
  return <DriverDashboardClient />;
}
