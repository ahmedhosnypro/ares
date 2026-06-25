"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";

export async function cancelBookingAction(id: string, formData: FormData) {
  const bookingId = ((formData.get("bookingId") as string | null) ?? "").trim();

  if (bookingId === "") {
    redirect(`/booking/${id}?error=invalid-booking`);
  }

  const activeSession = await getServerSession(authOptions);
  if (!activeSession?.accessToken) {
    redirect("/sign-in");
  }

  const response = await fetch(toApiUrl(`/api/bookings/${bookingId}/cancel`), {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${activeSession.accessToken}` },
  });

  if (response.ok) {
    redirect(`/booking/${bookingId}?notice=cancelled`);
  }

  if (response.status === 400) redirect(`/booking/${bookingId}?error=not-eligible`);
  if (response.status === 401 || response.status === 403) redirect(`/booking/${bookingId}?error=forbidden`);
  if (response.status === 404) redirect(`/booking/${bookingId}?error=not-found`);

  redirect(`/booking/${bookingId}?error=cancel-failed`);
}
