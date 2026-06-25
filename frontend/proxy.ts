import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const locales = ["ar", "en"];
const defaultLocale = "ar";

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  if (acceptLanguage.includes("en")) return "en";
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // NextAuth API routes — don't touch
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // If already has locale prefix, strip it for auth checks but serve normally
  const hasLocalePrefix = locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  // Determine the "clean" path (without locale prefix) for auth checks
  const cleanPath = hasLocalePrefix ? pathname.replace(/^\/(ar|en)/, "") || "/" : pathname;

  // Auth checks
  const token = await getToken({ req: request });

  if (cleanPath.startsWith("/admin")) {
    if (!token || !token.roles.includes("Admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  if (cleanPath.startsWith("/supplier")) {
    if (!token || !token.roles.includes("Supplier")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
  }

  // If already has locale prefix, serve as-is
  if (hasLocalePrefix) {
    return NextResponse.next();
  }

  // Rewrite internally to add locale (URL stays the same in browser)
  const locale = getLocale(request);
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
