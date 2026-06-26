"use client";

import { useRouter } from "@/shared/i18n/routing";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import type { Locale } from "@/shared/i18n/routing";

export function useLanguageSwitch() {
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: Locale) => {
    if (currentLocale === newLocale) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/set-locale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locale: newLocale }),
        });

        if (!response.ok) {
          throw new Error("Failed to set locale");
        }

        router.refresh();
      } catch {
        router.refresh();
      }
    });
  };

  return {
    currentLocale,
    switchLanguage,
    isPending,
  };
}
