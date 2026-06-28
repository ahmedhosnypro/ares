import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupplierVehiclesClient from "./SupplierVehiclesClient";

export default function SupplierVehiclesPage() {
  return <SupplierVehiclesClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.supplierVehicles");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
