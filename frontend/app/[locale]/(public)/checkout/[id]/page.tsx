"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { parseUtcDate, formatUtcDate } from "@/utils/dateTime";

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

function parseIntent(raw: string | null): BookingIntent | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingIntent;
  } catch {
    return null;
  }
}

function formatDate(iso: string, locale: string): string {
  return formatUtcDate(iso, locale, { year: "numeric", month: "short", day: "numeric" });
}

function calcDays(from: string, to: string): number {
  return Math.max(1, Math.ceil((parseUtcDate(to).getTime() - parseUtcDate(from).getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Booking summary sidebar ────────────────────────────────────────────────────

interface BookingSummaryProps {
  readonly intent: BookingIntent;
}

function BookingSummary({ intent }: BookingSummaryProps) {
  const t = useTranslations("publicPages.checkout");
  const locale = useLocale();
  const days = calcDays(intent.pickupDate, intent.returnDate);

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", position: "sticky", top: 24 }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
        {t("yourBooking")}
      </Typography>

      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <DirectionsCarIcon color="action" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {t("vehicle")}
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
              {t("pickup")}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(intent.pickupDate, locale)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <CalendarTodayIcon color="action" sx={{ mt: 0.25 }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {t("return")}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(intent.returnDate, locale)}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            {t("duration")}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {days} {days === 1 ? t("day") : t("days")}
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("total")}
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
  const t = useTranslations("publicPages.checkout");
  const callbackUrl = `/checkout/${vehicleId}`;

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        {t("almostThere")}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t("authPrompt")}
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
          {t("signInToAccount")}
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
          {t("createFreeAccount")}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
        {t("bookingSavedNote")}
      </Typography>
    </Paper>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CheckoutGatePage() {
  const t = useTranslations("publicPages.checkout");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();

  // Read intent once from sessionStorage (lazy init avoids setState-in-effect)
  const [intent] = useState<BookingIntent | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("bookingIntent");
    const parsed = parseIntent(raw);
    return parsed?.vehicleId === params.id ? parsed : null;
  });

  const [redirectError, setRedirectError] = useState("");

  // Redirect home if no valid intent
  useEffect(() => {
    if (!intent) {
      router.replace("/");
    }
  }, [intent, router]);

  // Once authenticated, continue into the staged checkout flow
  // (Driver Selection → Payment). No booking is created here — the booking is
  // created only after a successful payment. The saved intent is carried
  // forward via sessionStorage.
  useEffect(() => {
    if (status !== "authenticated" || !intent) return;
    try {
      router.replace(`/booking/driver-selection/${intent.vehicleId}`);
    } catch (error) {
      logger.error("Checkout gate redirect failed", error);
      setRedirectError(t("redirectError"));
    }
  }, [status, intent, router, t]);

  // Loading states
  if (status === "loading" || !intent) {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Authenticated: show spinner while routing into the staged checkout flow
  if (status === "authenticated") {
    return (
      <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <Stack sx={{ alignItems: "center" }} spacing={2}>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            {redirectError ? "" : t("takingToDriverSelection")}
          </Typography>
          {redirectError && (
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              {redirectError}
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
          {t("pageTitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
          {t("pageSubtitle")}
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
