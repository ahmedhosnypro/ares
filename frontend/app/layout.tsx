import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import MuiProvider from "@/providers/MuiProvider";
import Header from "../components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Ares | Business-first car rental",
  description:
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
    apple: [
      { url: "/img/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome", url: "/img/favicon/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/img/favicon/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MuiProvider>
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
