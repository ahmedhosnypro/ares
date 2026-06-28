import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupplierBookingsClient from "./_components/SupplierBookingsClient";

export default function SupplierBookingsPage() {
  return <SupplierBookingsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.supplierBookings");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
