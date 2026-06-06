import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Protect Admin routes
  if (path.startsWith("/admin")) {
    if (!token || !token.roles.includes("Admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect Supplier routes
  if (path.startsWith("/supplier")) {
    if (!token || !token.roles.includes("Supplier")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Set theme cookie if not present and user has a preference in headers
  const themeCookie = request.cookies.get("theme-mode");

  if (!themeCookie) {
    // Check if user agent suggests dark mode preference
    const userAgent = request.headers.get("user-agent") || "";
    const acceptHeader = request.headers.get("accept") || "";

    // Some browsers send dark mode hints
    if (userAgent.includes("Dark") || acceptHeader.includes("dark")) {
      response.cookies.set("theme-mode", "dark", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
