import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import PaymentClient, { type BookingDetailsDto } from "./_components/PaymentClient";

interface PageProps {
  readonly params: Promise<{ bookingId: string }>;
}

async function fetchBookingDetails(bookingId: string, accessToken: string): Promise<BookingDetailsDto | null> {
  try {
    const response = await fetch(toApiUrl(`/api/booking/${bookingId}/en`), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch booking: ${String(response.status)}`);
    }

    return (await response.json()) as BookingDetailsDto;
  } catch (error) {
    logger.error("Error fetching booking details for checkout", error);
    return null;
  }
}

export default async function CheckoutPage({ params }: PageProps) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect(`/sign-in?callbackUrl=/booking/payment/${bookingId}`);
  }

  const booking = await fetchBookingDetails(bookingId, session.accessToken);

  if (!booking) {
    notFound();
  }

  // If already paid/confirmed, redirect to confirmation
  if (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") {
    redirect(`/bookings/confirmation/${bookingId}`);
  }

  return <PaymentClient booking={booking} accessToken={session.accessToken} />;
}
