import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { fetchBookingDetails } from "./_components/booking-api";
import BookingDetailsView from "./_components/BookingDetailsView";
import { cancelBookingAction } from "./_actions/cancel-booking";
import { canCancelBooking, getFeedback, type SearchParamValue } from "./_components/booking-utils";
import { renderErrorState, renderSignInRequired } from "./_components/BookingRenderHelpers";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<Record<string, SearchParamValue>>;
}

export const generateMetadata = async ({ params }: Readonly<Pick<PageProps, "params">>): Promise<Metadata> => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const t = await getTranslations("customer.bookingDetail");

  if (!session?.accessToken) {
    return {
      title: t("metaTitle"),
      description: t("metaDescription"),
    };
  }

  try {
    const result = await fetchBookingDetails(id, session.accessToken);
    const carName = result.booking?.car?.name;
    const title = carName ? t("metaTitleWithCar", { carName }) : t("metaTitle");

    return {
      title,
      description: t("metaDescription"),
    };
  } catch {
    return {
      title: t("metaTitle"),
      description: t("metaDescription"),
    };
  }
};

export default async function BookingDetailsPage({ params, searchParams }: Readonly<PageProps>) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return renderSignInRequired();
  }

  const t = await getTranslations("customer.bookingDetail");

  const bookingResult = await fetchBookingDetails(id, session.accessToken).catch(() => ({
    booking: null,
    status: 500,
  }));

  if (!bookingResult.booking) {
    if (bookingResult.status === 404) {
      return await renderErrorState(t("error.notFound.title"), t("error.notFound.message"));
    }

    if (bookingResult.status === 403) {
      return await renderErrorState(t("error.accessDenied.title"), t("error.accessDenied.message"));
    }

    if (bookingResult.status === 401) {
      return await renderErrorState(t("error.sessionExpired.title"), t("error.sessionExpired.message"));
    }

    return await renderErrorState(t("error.generic.title"), t("error.generic.message"));
  }

  return (
    <BookingDetailsView
      booking={bookingResult.booking}
      routeBookingId={id}
      canCancel={canCancelBooking(bookingResult.booking.status)}
      onCancel={cancelBookingAction.bind(null, id)}
      accessToken={session.accessToken}
      feedback={getFeedback(resolvedSearchParams, t)}
    />
  );
}
