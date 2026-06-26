"use server";

import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";

export async function cancelBookingAction(id: string, formData: FormData) {
  const locale = await getLocale();
  const bookingId = ((formData.get("bookingId") as string | null) ?? "").trim();

  if (bookingId === "") {
    redirect({ href: `/booking/${id}?error=invalid-booking`, locale });
  }

  const activeSession = await getServerSession(authOptions);
  if (!activeSession?.accessToken) {
    return redirect({ href: "/sign-in", locale });
  }

  const response = await fetch(toApiUrl(`/api/bookings/${bookingId}/cancel`), {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${activeSession.accessToken}` },
  });

  if (response.ok) {
    redirect({ href: `/booking/${bookingId}?notice=cancelled`, locale });
  }

  if (response.status === 400) redirect({ href: `/booking/${bookingId}?error=not-eligible`, locale });
  if (response.status === 401 || response.status === 403)
    redirect({ href: `/booking/${bookingId}?error=forbidden`, locale });
  if (response.status === 404) redirect({ href: `/booking/${bookingId}?error=not-found`, locale });

  redirect({ href: `/booking/${bookingId}?error=cancel-failed`, locale });
}
