import { getTranslations } from "next-intl/server";
import DriverTripsClient from "./DriverTripsClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.driverTrips" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DriverTripsPage() {
  return <DriverTripsClient />;
}
