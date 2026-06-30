import { cookies, headers } from "next/headers";
import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { supportedLocales, defaultLocale } from "./constants";

async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && supportedLocales.includes(localeCookie.value as (typeof supportedLocales)[number])) {
    return localeCookie.value;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  const messages = (await import(`../messages/${locale}`)) as { default: AbstractIntlMessages };

  return {
    locale,
    messages: messages.default,
  };
});
