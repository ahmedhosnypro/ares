import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupplierEarningsClient from "./SupplierEarningsClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.supplierEarnings");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SupplierEarningsPage() {
  return <SupplierEarningsClient />;
}
