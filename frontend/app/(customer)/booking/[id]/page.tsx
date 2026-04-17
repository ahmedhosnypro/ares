import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { fetchBookingDetails } from "./_components/booking-api";
import BookingDetailsView from "./_components/BookingDetailsView";
import { cancelBookingAction } from "./_actions/cancel-booking";
import { canCancelBooking, getFeedback, type SearchParamValue } from "./_components/booking-utils";
import { renderErrorState, renderSignInRequired } from "./_components/BookingRenderHelpers";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<Record<string, SearchParamValue>>;
}

export const generateMetadata = async ({ params }: Readonly<Pick<PageProps, "params">>): Promise<Metadata> => {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return {
      title: "Booking Details | Rent Your Dream Car",
      description: "View your booking details and reservation summary.",
    };
  }

  try {
    const result = await fetchBookingDetails(id, session.accessToken);
    const carName = result.booking?.car?.name;
    const title = carName ? `Booking ${carName} | Rent Your Dream Car` : "Booking Details | Rent Your Dream Car";

    return {
      title,
      description: "View your booking details and reservation summary.",
    };
  } catch {
    return {
      title: "Booking Details | Rent Your Dream Car",
      description: "View your booking details and reservation summary.",
    };
  }
};

export default async function BookingDetailsPage({ params, searchParams }: Readonly<PageProps>) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return renderSignInRequired();
  }

  const bookingResult = await fetchBookingDetails(id, session.accessToken).catch(() => ({
    booking: null,
    status: 500,
  }));

  if (!bookingResult.booking) {
    if (bookingResult.status === 404) {
      return renderErrorState("Booking not found", "The booking you are looking for does not exist.");
    }

    if (bookingResult.status === 403) {
      return renderErrorState("Access denied", "You are not allowed to view this booking.");
    }

    if (bookingResult.status === 401) {
      return renderErrorState("Session expired", "Please sign in again to continue.");
    }

    return renderErrorState("Unable to load booking", "Please try again in a moment.");
  }

  return (
    <BookingDetailsView
      booking={bookingResult.booking}
      routeBookingId={id}
      canCancel={canCancelBooking(bookingResult.booking.status)}
      onCancel={cancelBookingAction.bind(null, id)}
      feedback={getFeedback(resolvedSearchParams)}
    />
  );
}
