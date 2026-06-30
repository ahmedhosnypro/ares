import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { supportedLocales, defaultLocale } from "./constants";

export const routing = defineRouting({
  locales: [...supportedLocales],
  defaultLocale,
  localePrefix: "never",
});

export type Locale = (typeof supportedLocales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
