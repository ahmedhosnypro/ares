import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./theme-transition.css";
import AuthProvider from "@/providers/AuthProvider";
import MuiProvider from "@/providers/MuiProvider";
import Header from "../components/layout/Header";
import { getServerTheme } from "@/lib/server-theme-detection";
import ThemeWatcher from "./[locale]/_components/ThemeWatcher";
import React from "react";
import { createAppTheme } from "@/providers/theme";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const geistSans = localFont({
  variable: "--font-geist-sans",
  src: [
    { path: "../public/fonts/geist-latin-ext-100-normal.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-100-italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-200-italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-800-italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/geist-latin-ext-900-normal.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/geist-latin-ext-900-italic.woff2", weight: "900", style: "italic" },
    { path: "../public/fonts/geist-latin-100-normal.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/geist-latin-100-italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/geist-latin-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/geist-latin-200-italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/geist-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/geist-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/geist-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/geist-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/geist-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/geist-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/geist-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/geist-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/geist-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/geist-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/geist-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/geist-latin-800-italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/geist-latin-900-normal.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/geist-latin-900-italic.woff2", weight: "900", style: "italic" },
  ],
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: [
    { path: "../public/fonts/geist-mono-latin-ext-100-normal.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-100-italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-200-italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-800-italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-ext-900-normal.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-ext-900-italic.woff2", weight: "900", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-100-normal.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-100-italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-200-italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-800-italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/geist-mono-latin-900-normal.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/geist-mono-latin-900-italic.woff2", weight: "900", style: "italic" },
  ],
});

async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && ["ar", "en"].includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  const common = messages.common as { title?: string; description?: string };

  return {
    title: common.title || "Ares | Business-first car rental",
    description:
      common.description ||
      "Ares is a professional car rental platform offering comprehensive vehicle search, booking management, and premium rental services.",
    icons: {
      icon: [
        { url: "/img/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/img/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/img/favicon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/img/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
        { url: "/img/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/img/favicon/favicon-128x128.png", sizes: "128x128", type: "image/png" },
        { url: "/img/favicon/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/img/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      other: [
        { rel: "android-chrome", url: "/img/favicon/android-chrome-192x192.png", sizes: "192x192" },
        { rel: "android-chrome", url: "/img/favicon/android-chrome-512x512.png", sizes: "512x512" },
      ],
    },
  };
}

export default async function RootLayout({ children }: { readonly children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  // Detect theme preference on server
  const initialTheme = await getServerTheme();
  const theme = createAppTheme(initialTheme);
  const bgFallbackColor = theme.palette.background.default;

  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} data-theme={initialTheme} style={{ backgroundColor: bgFallbackColor }}>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} preload`}
        style={{ backgroundColor: bgFallbackColor, color: theme.palette.text.primary }}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeWatcher />
          <MuiProvider initialTheme={initialTheme}>
            <AuthProvider>
              <Header />
              {children}
            </AuthProvider>
          </MuiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
