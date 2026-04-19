import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Box, Container, Grid, Paper, Stack, Typography, Divider } from "@mui/material";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";
import PaymentForm from "./_components/PaymentForm";

interface PageProps {
  readonly params: Promise<{ bookingId: string }>;
}

interface BookingDetailsDto {
  readonly id: string;
  readonly car: {
    readonly vehicleId: string;
    readonly make: string;
    readonly model: string;
    readonly imageUrl: string;
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
    redirect(`/login?callbackUrl=/booking/checkout/${bookingId}`);
  }

  const booking = await fetchBookingDetails(bookingId, session.accessToken);

  if (!booking) {
    notFound();
  }

  // If already paid, redirect to confirmation
  if (booking.status === "Paid" || booking.status === "Completed") {
    redirect(`/bookings/confirmation/${bookingId}`);
  }

  const pickupDate = new Date(booking.from);
  const returnDate = new Date(booking.to);
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={900} mb={4}>
          Checkout
        </Typography>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid size={{ xs: 12, md: 5 }} order={{ xs: 1, md: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                position: "sticky",
                top: 24,
              }}
            >
              <Typography variant="h6" fontWeight={800} mb={3}>
                Order Summary
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {booking.car.make} {booking.car.model}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supplier: {booking.car.supplier.name}
                  </Typography>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pickup
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {pickupDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {booking.pickupLocation.label}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Return
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {returnDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {booking.dropOffLocation.label}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Rental Duration
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {days} {days === 1 ? "Day" : "Days"}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" pt={1}>
                  <Typography variant="h6" fontWeight={800}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">
                    {formatCurrency(booking.price)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Payment Form */}
          <Grid size={{ xs: 12, md: 7 }} order={{ xs: 2, md: 1 }}>
            <PaymentForm bookingId={booking.id} amount={booking.price} accessToken={session.accessToken} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
