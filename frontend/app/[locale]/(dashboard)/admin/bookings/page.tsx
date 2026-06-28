import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "@/shared/i18n/routing";
import { getLocale } from "next-intl/server";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import type { Booking, AdminBookingAnalytics } from "@/api-clients/bookings/bookings";
import BookingsClient from "./_components/BookingsClient";

export const metadata: Metadata = {
  title: "Bookings Management | ARES Admin",
  description: "Manage all vehicle bookings in the ARES platform",
};

interface BookingResponse {
  resultData?: Booking[];
  data?: Booking[];
  items?: Booking[];
  pageInfo?: Array<{ totalRecords: number }>;
  totalCount?: number;
  totalPages?: number;
}

export default async function BookingsPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);

  if (!session || !session.user.roles.includes("Admin") || !session.accessToken) {
    return redirect({ href: "/", locale });
  }

  let initialBookings: { bookings: Booking[]; totalCount: number; totalPages: number } | undefined = undefined;
  let initialAnalytics: AdminBookingAnalytics | undefined = undefined;

  const user = { id: session.user.id, role: session.user.roles[0] || "Admin" };

  try {
    const payload = {
      userId: null,
      suppliers: user.role === "Supplier" ? [user.id] : null,
      statuses: null,
      carId: null,
      filter: {
        from: null,
        to: null,
        keyword: null,
        pickupLocation: null,
        dropOffLocation: null,
      },
      page: 1,
      size: 10,
      language: "en",
    };

    const [bookingsData, analyticsData] = await Promise.all([
      apiFetchJson<BookingResponse>(`/api/admin/bookings/search/1/10`, {
        method: "POST",
        body: JSON.stringify(payload),
        accessToken: session.accessToken,
      }),
      apiFetchJson<AdminBookingAnalytics>(`/api/admin/bookings/analytics`, {
        method: "GET",
        accessToken: session.accessToken,
      }),
    ]);

    const bookings = bookingsData.resultData || bookingsData.data || bookingsData.items || [];
    const totalCount = bookingsData.pageInfo?.[0]?.totalRecords || bookingsData.totalCount || 0;
    const totalPages = bookingsData.totalPages || Math.ceil(totalCount / 10) || 1;

    initialBookings = { bookings, totalCount, totalPages };
    initialAnalytics = analyticsData;
  } catch (error) {
    logger.error("Failed to fetch initial bookings or analytics on server side", error);
  }

  return <BookingsClient initialBookings={initialBookings} initialAnalytics={initialAnalytics} />;
}
