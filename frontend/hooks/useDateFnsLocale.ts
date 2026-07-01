import { useLocale } from "next-intl";
import { format, type FormatOptions } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import { parseUtcDate } from "@/utils/dateTime";

const localeMap: Record<string, FormatOptions["locale"]> = {
  en: enUS,
  ar,
};

export function useDateFnsLocale() {
  const locale = useLocale();

  const dateFnsLocale = localeMap[locale] ?? enUS;

  const formatLocalized = (date: Date | number | string, formatStr: string): string => {
    // Parse strings as UTC so display matches server-stored values.
    const dateObj = typeof date === "string" ? parseUtcDate(date) : date;
    return format(dateObj, formatStr, { locale: dateFnsLocale });
  };

  return { dateFnsLocale, formatLocalized };
}
