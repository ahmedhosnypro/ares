import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import rtlPlugin from "stylis-plugin-rtl";

const cacheLtr = createCache({
  key: "ltr",
  prepend: true,
});
cacheLtr.compat = true;

const cacheRtl = createCache({
  key: "rtl",
  prepend: true,
  stylisPlugins: [rtlPlugin],
});
cacheRtl.compat = true;

export default function EmotionCacheProvider({ children }: Readonly<{ children: ReactNode }>) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const cache = isRtl ? cacheRtl : cacheLtr;

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) {
      return null;
    }
    const styles = Object.values(cache.inserted).join(" ");
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
