import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NotificationsClient from "./NotificationsClient";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("customer.notifications");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
};

export default function CustomerNotificationsPage() {
  return <NotificationsClient />;
}
