import { getTranslations } from "next-intl/server";
import DriverProfileClient from "./DriverProfileClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.driverProfile" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function DriverProfilePage() {
  return <DriverProfileClient />;
}
