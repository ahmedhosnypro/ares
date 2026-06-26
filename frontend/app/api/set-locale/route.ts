import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("locale" in body) ||
      typeof body.locale !== "string" ||
      !["ar", "en"].includes(body.locale)
    ) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const locale = body.locale;

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
      httpOnly: false,
    });

    return NextResponse.json({ success: true, locale });
  } catch {
    return NextResponse.json({ error: "Failed to set locale" }, { status: 500 });
  }
}
