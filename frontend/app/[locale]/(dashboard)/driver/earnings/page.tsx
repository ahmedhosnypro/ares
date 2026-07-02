import { getTranslations } from "next-intl/server";
import DriverEarningsClient from "./DriverEarningsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.driverEarnings" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DriverEarningsPage() {
  return <DriverEarningsClient />;
}
