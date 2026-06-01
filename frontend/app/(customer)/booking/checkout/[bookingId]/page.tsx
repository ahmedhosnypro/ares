import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Box, Container, Grid, Paper, Stack, Typography, Divider } from "@mui/material";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import StarIcon from "@mui/icons-material/Star";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import PaymentForm from "./_components/PaymentForm";
import ExpressCheckout from "./_components/ExpressCheckout";

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

  const pickupDate = new Date(booking.from);
  const returnDate = new Date(booking.to);
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

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
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                position: "sticky",
                top: 100,
                overflow: "hidden",
                boxShadow: t => t.palette.shadow.card,
              }}
            >
              {/* Vehicle Image Overlay */}
              <Box sx={{ height: 192, width: "100%", bgcolor: "background.default", position: "relative" }}>
                <Box
                  component="img"
                  src={toImageUrl(booking.car.image) || "https://placehold.co/600x400?text=Vehicle"}
                  alt={`${booking.car.make} ${booking.car.model}`}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    bgcolor: "overlay.blur",
                    backdropFilter: "blur(12px)",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    boxShadow: 1,
                  }}
                >
                  <StarIcon sx={{ fontSize: 16, color: "primary.main", mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                    Premium Class
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5 }}>
                  {booking.car.make} {booking.car.model}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Supplied by {booking.car.supplier.name}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {/* Timeline Details */}
                <Stack spacing={3} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <FlightLandIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
                      >
                        Pickup
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {booking.pickupLocation.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pickupDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <FlightTakeoffIcon color="action" sx={{ mr: 2, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
                      >
                        Return
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {booking.dropOffLocation.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {returnDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Price Breakdown */}
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Rental ({days} {days === 1 ? "Day" : "Days"})
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                      {formatCurrency(booking.price)}
                    </Typography>
                  </Box>
                  {/* Note: Mocking taxes/fees display as requested by the mockup, but keeping total correct based on booking.price */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      pt: 2,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", fontFamily: "monospace" }}>
                      {formatCurrency(booking.price)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
