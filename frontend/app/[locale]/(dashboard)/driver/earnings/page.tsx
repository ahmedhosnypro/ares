import { getTranslations } from "next-intl/server";
import DriverEarningsClient from "./DriverEarningsClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.driverEarnings" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DriverEarningsPage() {
  return <DriverEarningsClient />;
}
