import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("publicPages.contact");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
