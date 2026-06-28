import { useTranslations } from "next-intl";

export default function AdminSchedulerPage() {
  const t = useTranslations("dashboardAdmin.scheduler");
  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
