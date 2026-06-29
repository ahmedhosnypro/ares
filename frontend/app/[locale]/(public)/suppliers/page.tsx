import { getTranslations } from "next-intl/server";

export default async function SuppliersPage() {
  const t = await getTranslations("publicPages.suppliers.index");

  return (
    <main>
      <h1>{t("heading")}</h1>
    </main>
  );
}
