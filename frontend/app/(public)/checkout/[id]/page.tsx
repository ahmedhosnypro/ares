"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";

interface BookingIntent {
  vehicleId: string;
  pickupLocationId: string;
  dropOffLocationId: string;
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  vehicleLabel: string;
  pricePerDay: number;
}

interface BookingApiSuccess {
  readonly bookingId?: string;
  readonly bookingNumber?: string;
}

interface BookingApiError {
  readonly message?: string;
  readonly validationErrors?: readonly { readonly message?: string }[];
}

function parseIntent(raw: string | null): BookingIntent | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingIntent;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calcDays(from: string, to: string): number {
  return Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Booking summary sidebar ────────────────────────────────────────────────────

interface BookingSummaryProps {
  readonly intent: BookingIntent;
}

function BookingSummary({ intent }: BookingSummaryProps) {
  const days = calcDays(intent.pickupDate, intent.returnDate);

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", position: "sticky", top: 24 }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
        Your Booking
      </Typography>

      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <DirectionsCarIcon color="action" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Vehicle
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {intent.vehicleLabel}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <CalendarTodayIcon color="action" sx={{ mt: 0.25 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Pickup
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(intent.pickupDate)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <CalendarTodayIcon color="action" sx={{ mt: 0.25 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Return
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(intent.returnDate)}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Duration
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {days} {days === 1 ? "day" : "days"}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Total
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900 }} color="primary.main">
            {formatCurrency(intent.totalPrice)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ── Auth gate panel ────────────────────────────────────────────────────────────

interface AuthGateProps {
  readonly vehicleId: string;
}

function AuthGate({ vehicleId }: AuthGateProps) {
  const callbackUrl = `/checkout/${vehicleId}`;

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Almost there!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Sign in or create a free account to complete your booking. It only takes a minute.
      </Typography>

      <Stack spacing={2}>
        <Button
          component={Link}
          href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          fullWidth
          sx={{ py: 1.75, fontWeight: 700, textTransform: "none", borderRadius: "999px" }}
        >
          Sign in to my account
        </Button>

        <Button
          component={Link}
          href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          variant="outlined"
          size="large"
          startIcon={<PersonAddIcon />}
          fullWidth
          sx={{ py: 1.75, fontWeight: 700, textTransform: "none", borderRadius: "999px" }}
        >
          Create a free account
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
        Your booking details are saved and will be confirmed right after you sign in.
      </Typography>
    </Paper>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CheckoutGatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Read intent once from sessionStorage (lazy init avoids setState-in-effect)
  const [intent] = useState<BookingIntent | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("bookingIntent");
    const parsed = parseIntent(raw);
    return parsed?.vehicleId === params.id ? parsed : null;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Redirect home if no valid intent
  useEffect(() => {
    if (!intent) {
      router.replace("/");
    }
  }, [intent, router]);

  // Once authenticated and intent is loaded, auto-submit the booking
  useEffect(() => {
    if (status !== "authenticated" || !intent || isSubmitting) return;

    const accessToken = session.accessToken;

    const createBooking = async () => {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const response = await fetch(toApiUrl("/api/bookings/create"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            vehicleId: intent.vehicleId,
            pickupLocationId: intent.pickupLocationId,
            dropOffLocationId: intent.dropOffLocationId,
            pickupDate: intent.pickupDate,
            returnDate: intent.returnDate,
            driverId: null,
            payLater: true,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as BookingApiError | null;
          setSubmitError(
            payload?.validationErrors?.[0]?.message ?? payload?.message ?? "Booking request failed. Please try again."
          );
          setIsSubmitting(false);
          return;
        }

        const payload = (await response.json()) as BookingApiSuccess;
        sessionStorage.removeItem("bookingIntent");

        if (payload.bookingId) {
          router.replace(`/booking/checkout/${payload.bookingId}`);
        } else {
          router.replace("/bookings");
        }
      } catch (error) {
        logger.error("Checkout gate booking failed", error);
        setSubmitError("Unable to create booking right now. Please try again.");
        setIsSubmitting(false);
      }
    };

    void createBooking();
  }, [status, session, intent, isSubmitting, router]);

  // Loading states
  if (status === "loading" || !intent) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Authenticated: show spinner while booking is being created
  if (status === "authenticated") {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack sx={{ alignItems: "center" }} spacing={2}>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            {submitError ? "" : "Creating your booking…"}
          </Typography>
          {submitError && (
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              {submitError}
            </Alert>
          )}
        </Stack>
      </Box>
    );
  }

  // Unauthenticated: show booking summary + auth gate
  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Complete your booking
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
          You&apos;re one step away from reserving your vehicle.
        </Typography>

        <Grid container spacing={4}>
          {/* Auth gate */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 2, md: 1 } }}>
            <AuthGate vehicleId={params.id} />
          </Grid>

          {/* Booking summary */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 1, md: 2 } }}>
            <BookingSummary intent={intent} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
