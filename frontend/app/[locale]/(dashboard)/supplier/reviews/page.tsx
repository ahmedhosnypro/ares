import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupplierReviewsClient from "./SupplierReviewsClient";

export default function SupplierReviewsPage() {
  return <SupplierReviewsClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.supplierReviews");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
