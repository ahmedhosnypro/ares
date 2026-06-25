import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && ["ar", "en"].includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return "ar";
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
