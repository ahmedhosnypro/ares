import { getTranslations } from "next-intl/server";

export default async function FaqPage() {
  const t = await getTranslations("publicPages.faq");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
