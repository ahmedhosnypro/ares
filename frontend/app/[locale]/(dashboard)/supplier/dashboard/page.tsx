import { getTranslations } from "next-intl/server";
import SupplierDashboardClient from "./SupplierDashboardClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.supplierDashboard" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SupplierDashboardPage() {
  return <SupplierDashboardClient />;
}
