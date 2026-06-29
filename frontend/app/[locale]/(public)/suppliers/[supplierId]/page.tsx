import { getTranslations } from "next-intl/server";

export default async function SupplierProfilePage() {
  const t = await getTranslations("publicPages.suppliers.detail");

  return (
    <main>
      <h1>{t("pageTitle")}</h1>
    </main>
  );
}
