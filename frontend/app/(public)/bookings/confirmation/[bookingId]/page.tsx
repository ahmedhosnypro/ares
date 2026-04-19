import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Box, Container, Paper, Stack, Typography, Button, Divider, Grid } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";

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

interface PaymentDto {
  readonly transactionId: string;
  readonly bookingId: string;
  readonly status: string;
}

async function fetchBookingDetails(bookingId: string, accessToken: string): Promise<BookingDetailsDto | null> {
  try {
    const response = await fetch(toApiUrl(`/api/booking/${bookingId}/en`), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as BookingDetailsDto;
  } catch (error) {
    logger.error("Error fetching booking details for confirmation", error);
    return null;
  }
}

async function fetchTransactionId(bookingId: string, accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(toApiUrl("/api/v1/payments/history?pageSize=50"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data: PaymentDto[] };
    const payment = payload.data.find(p => p.bookingId === bookingId && p.status === "Captured");
    return payment?.transactionId ?? null;
  } catch (error) {
    logger.error("Error fetching transaction ID", error);
    return null;
  }
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    redirect(`/login?callbackUrl=/bookings/confirmation/${bookingId}`);
  }

  const booking = await fetchBookingDetails(bookingId, session.accessToken);

  if (!booking) {
    notFound();
  }

  const transactionId = await fetchTransactionId(bookingId, session.accessToken);
  const pickupDate = new Date(booking.from);
  const returnDate = new Date(booking.to);

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 10 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: 6, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
          <Typography variant="h3" fontWeight={900} gutterBottom>
            Booking Confirmed!
          </Typography>
          <Typography variant="h6" color="text.secondary" mb={4}>
            Your reservation has been successfully placed and paid.
          </Typography>

          <Box sx={{ bgcolor: "grey.50", borderRadius: 4, p: { xs: 2, md: 4 }, mb: 4, textAlign: "left" }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Booking Reference
                </Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {bookingId.slice(0, 8).toUpperCase()}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={700}>Dates</Typography>
                  </Box>
                  <Typography variant="body2">
                    {pickupDate.toLocaleDateString()} - {returnDate.toLocaleDateString()}
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={700}>Vehicle</Typography>
                  </Box>
                  <Typography variant="body2">
                    {booking.car.make} {booking.car.model}
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={12}>
                <Divider />
              </Grid>

              <Grid size={12}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>Total Paid</Typography>
                  <Typography variant="h5" fontWeight={900}>{formatCurrency(booking.price)}</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            {transactionId && (
              <Button
                variant="contained"
                size="large"
                startIcon={<ReceiptIcon />}
                href={toApiUrl(`/api/v1/payments/${transactionId}/receipt`)}
                target="_blank"
                sx={{ borderRadius: 3, py: 1.5, px: 4, fontWeight: 700 }}
              >
                Download Receipt
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              href="/account/bookings"
              sx={{ borderRadius: 3, py: 1.5, px: 4, fontWeight: 700 }}
            >
              My Bookings
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
