import { getTranslations } from "next-intl/server";

export default async function ActivatePage() {
  const t = await getTranslations("authPages.activate");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
