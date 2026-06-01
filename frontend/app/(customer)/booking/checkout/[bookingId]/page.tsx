import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import PaymentForm from "./_components/PaymentForm";
import ExpressCheckout from "./_components/ExpressCheckout";
import OrderSummary from "./_components/OrderSummary";

interface PageProps {
  readonly params: Promise<{ bookingId: string }>;
}

interface BookingDetailsDto {
  readonly id: string;
  readonly car: {
    readonly vehicleId: string;
    readonly make: string;
    readonly model: string;
    readonly image: string;
    readonly supplier: {
      readonly id: string;
      readonly name: string;
    };
  };
  readonly pickupLocation: { readonly label: string };
  readonly dropOffLocation: { readonly label: string };
  readonly from: string;
  readonly to: string;
  readonly price: number;
  readonly status: string;
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
    redirect(`/sign-in?callbackUrl=/booking/checkout/${bookingId}`);
  }

  const booking = await fetchBookingDetails(bookingId, session.accessToken);

  if (!booking) {
    notFound();
  }

  // If already paid, redirect to confirmation
  if (booking.status === "Paid" || booking.status === "Completed") {
    redirect(`/bookings/confirmation/${bookingId}`);
  }

  const enableApplePay = process.env.ENABLE_APPLE_PAY === "true";
  const enableGooglePay = process.env.ENABLE_GOOGLE_PAY === "true";

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Header & Stepper */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.04em", color: "primary.main" }}>
              Complete Booking
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: "1.125rem" }}>
              Review your details and complete secure payment.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "primary.main", borderRadius: 999 }} />
              <Box sx={{ height: 8, flexGrow: 1, bgcolor: "secondary.main", borderRadius: 999, position: "relative" }}>
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    top: -24,
                    right: 0,
                    fontWeight: 700,
                    color: "secondary.main",
                  }}
                >
                  Payment
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Left Column: Payment */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
            <Stack spacing={4}>
              <ExpressCheckout enableApplePay={enableApplePay} enableGooglePay={enableGooglePay} />
              <PaymentForm bookingId={booking.id} amount={booking.price} accessToken={session.accessToken} />
            </Stack>
          </Grid>

          {/* Right Column: Order Summary */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
            <OrderSummary booking={booking} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
