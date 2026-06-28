import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupplierBookingDetailsClient from "./_components/SupplierBookingDetailsClient";

export default async function SupplierBookingDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierBookingDetailsClient bookingId={id} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.supplierBookingDetail");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
