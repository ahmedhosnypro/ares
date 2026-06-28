import { getTranslations } from "next-intl/server";
import CompleteProfileClient from "./CompleteProfileClient";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "dashboard.driverCompleteProfile" });

  return {
    title: t("title"),
    description: t("pageDescription"),
  };
}

export default function CompleteProfilePage() {
  return <CompleteProfileClient />;
}
