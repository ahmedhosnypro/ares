import Image from "next/image";
import Link from "next/link";
import {
  Box,
  Button,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  type AlertColor,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarIcon,
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { toImageUrl } from "@/utils/image-url";
import { type BookingDetails } from "./types";

interface BookingDetailsViewProps {
  readonly booking: BookingDetails;
  readonly routeBookingId: string;
  readonly canCancel: boolean;
  readonly onCancel: (formData: FormData) => Promise<void>;
  readonly feedback?: {
    readonly severity: AlertColor;
    readonly message: string;
  };
}

function formatDate(input?: string): string {
  if (!input) {
    return "N/A";
  }

  return new Date(input).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount?: number): string {
  if (typeof amount !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDurationDays(from?: string, to?: string): number | null {
  if (!from || !to) {
    return null;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / msPerDay);

  return Number.isFinite(diffDays) && diffDays > 0 ? diffDays : null;
}

function getStatusColor(status?: string): "success" | "warning" | "error" | "default" {
  switch (status?.toLowerCase()) {
    case "paid":
    case "reserved":
      return "success";
    case "pending":
    case "deposit":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

export default function BookingDetailsView({
  booking,
  routeBookingId,
  canCancel,
  onCancel,
  feedback,
}: Readonly<BookingDetailsViewProps>) {
  const bookingRef = booking.id ?? routeBookingId;
  const imageUrl = toImageUrl(booking.car?.image) ?? "/placeholder-car.jpg";
  const durationDays = getDurationDays(booking.from, booking.to);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Box sx={{ mx: "auto", maxWidth: 1200, px: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Booking Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ref ID: {bookingRef}
            </Typography>
          </Box>

          <Link href="/bookings" style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
            >
              Back to Bookings
            </Button>
          </Link>
        </Stack>

        {feedback ? (
          <Paper
            variant="outlined"
            sx={{
              mb: 3,
              borderColor: "border.main",
              bgcolor: "background.paper",
              boxShadow: "shadow.card",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography
                variant="body2"
                color={feedback.severity === "success" ? "success.main" : "error.main"}
                fontWeight={700}
              >
                {feedback.message}
              </Typography>
            </CardContent>
          </Paper>
        ) : null}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              sx={{
                border: "1px solid",
                borderColor: "border.main",
                bgcolor: "background.paper",
                boxShadow: "shadow.card",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 220, sm: 320 },
                  bgcolor: "action.hover",
                }}
              >
                <Image
                  src={imageUrl}
                  alt={booking.car?.name ?? "Booked car"}
                  fill
                  sizes="(max-width: 900px) 100vw, 66vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>

              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                      {booking.car?.name ?? "Unknown car"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Supplier: {booking.car?.supplier?.fullName ?? "N/A"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                    <Chip label={booking.status ?? "Unknown"} color={getStatusColor(booking.status)} size="small" />
                    <Chip label={booking.payLater ? "Pay later" : "Prepaid"} variant="outlined" size="small" />
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={1.5}>
                      <Box sx={{ color: "primary.main", display: "flex", pt: 0.25 }}>
                        <LocationIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          Pick-up
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.pickupLocation?.name ?? "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(booking.from)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={1.5}>
                      <Box sx={{ color: "secondary.main", display: "flex", pt: 0.25 }}>
                        <LocationIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          Drop-off
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.dropOffLocation?.name ?? "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(booking.to)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={1.5}>
                  <Box sx={{ color: "text.secondary", display: "flex", pt: 0.25 }}>
                    <PersonIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      Driver
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.driver?.fullName ?? "N/A"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.driver?.email ?? "No email available"}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              sx={{
                border: "1px solid",
                borderColor: "border.main",
                bgcolor: "background.paper",
                boxShadow: "shadow.card",
                position: { lg: "sticky" },
                top: { lg: 96 },
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
                  Reservation Summary
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Vehicle
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>
                      {booking.car?.name ?? "N/A"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.primary" fontWeight={700}>
                      {durationDays ? `${String(durationDays)} days` : "N/A"}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    Total Price
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main">
                    {formatCurrency(booking.price)}
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  <Link href="/bookings" style={{ textDecoration: "none" }}>
                    <Button variant="outlined" fullWidth>
                      View All Bookings
                    </Button>
                  </Link>
                  <Box component="form" action={onCancel}>
                    <input type="hidden" name="bookingId" value={bookingRef} />
                    <Button type="submit" variant="contained" color="secondary" fullWidth disabled={!canCancel}>
                      {canCancel ? "Cancel Booking" : "Cancellation Unavailable"}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
