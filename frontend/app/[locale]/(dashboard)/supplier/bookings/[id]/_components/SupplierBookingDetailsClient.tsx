"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  IconButton,
  Divider,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ArrowBackRounded as BackIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PlaceOutlined as PlaceIcon,
  EventOutlined as EventIcon,
  PersonOutlineRounded as PersonIcon,
  AttachMoneyRounded as MoneyIcon,
  CreditCardOutlined as CreditCardIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import {
  getSupplierBookingById,
  type SupplierBookingDetailsDto,
} from "@/api-clients/supplier-bookings/supplier-bookings";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { ApiError } from "@/utils/api-client";

const formatDateLong = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCurrency = (n?: number | null) => {
  if (n == null || isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
};

const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "active" || s === "confirmed" || s === "pickup") return "success" as const;
  if (s === "completed") return "info" as const;
  if (s === "cancelled" || s === "returned") return "error" as const;
  return "warning" as const;
};

interface SectionCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      <Stack spacing={1.5}>{children}</Stack>
    </Paper>
  );
}

interface FieldRowProps {
  readonly label: string;
  readonly value?: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}
      >
        {label}
      </Typography>
      <Box sx={{ typography: "body2", fontWeight: 600, textAlign: "right" }}>{value ?? "—"}</Box>
    </Stack>
  );
}

export default function SupplierBookingDetailsClient({ bookingId }: { readonly bookingId: string }) {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();
  const t = useTranslations("dashboard.supplierBookingDetail");

  const [booking, setBooking] = useState<SupplierBookingDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!session?.accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getSupplierBookingById(session.accessToken, bookingId);
        setBooking(data);
      } catch (e: unknown) {
        logger.error("Failed to load supplier booking details", e);
        if (e instanceof ApiError) {
          if (e.status === 404) {
            setError(t("errors.notFoundOrDenied"));
          } else if (e.status === 401) {
            setError(t("errors.sessionExpired"));
          } else if (e.status === 403) {
            setError(t("errors.forbidden"));
          } else {
            setError(t("errors.loadFailedWithStatus", { status: String(e.status) }));
          }
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(t("errors.loadFailed"));
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [bookingId, session?.accessToken, t]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Alert severity="error">{error ?? t("errors.notFound")}</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => {
            router.push("/supplier/bookings");
          }}
        >
          {t("backToBookings")}
        </Button>
      </Box>
    );
  }

  const statusColorKey = getStatusConfig(booking.status);
  const shortRef = booking.bookingNumber ?? (booking.id ? booking.id.split("-")[0] : "—");

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* ── HEADER ── */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Tooltip title={t("backToBookingsTooltip")}>
            <IconButton
              onClick={() => {
                router.push("/supplier/bookings");
              }}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("header.title", { ref: shortRef })}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
              <Chip
                size="small"
                label={booking.status ?? t("header.statusDraft")}
                color={statusColorKey}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              />
              <Typography variant="body2" color="text.secondary">
                {t("header.created", { date: formatDateLong(booking.createdAt) })}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Stack>

      {/* ── SECTIONS GRID ── */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        {/* Customer */}
        <SectionCard icon={<PersonIcon />} title={t("customerInfo.title")}>
          <FieldRow label={t("customerInfo.name")} value={booking.customer?.name ?? "—"} />
          <FieldRow label={t("customerInfo.email")} value={booking.customer?.email ?? "—"} />
          <FieldRow label={t("customerInfo.phone")} value={booking.customer?.phone ?? "—"} />
        </SectionCard>

        {/* Vehicle */}
        <SectionCard icon={<CarIcon />} title={t("vehicleInfo.title")}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              variant="rounded"
              src={toImageUrl(booking.vehicle?.primaryImageUrl)}
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: "primary.main",
              }}
            >
              <CarIcon />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>
                {booking.vehicle?.make} {booking.vehicle?.model} {booking.vehicle?.year}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("vehicleInfo.plate", { plate: booking.vehicle?.licensePlate ?? "—" })}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        {/* Booking */}
        <SectionCard icon={<EventIcon />} title={t("bookingInfo.title")}>
          <FieldRow label={t("bookingInfo.pickupDate")} value={formatDateLong(booking.pickupDate)} />
          <FieldRow label={t("bookingInfo.returnDate")} value={formatDateLong(booking.returnDate)} />
          <FieldRow label={t("bookingInfo.totalDays")} value={booking.totalDays != null ? t("bookingInfo.daysUnit", { count: booking.totalDays }) : "—"} />
          <Divider />
          <FieldRow
            label={t("bookingInfo.pickupLocation")}
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <span>{booking.pickupLocation?.name ?? "—"}</span>
              </Stack>
            }
          />
          <FieldRow
            label={t("bookingInfo.dropoffLocation")}
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <span>{booking.dropOffLocation?.name ?? "—"}</span>
              </Stack>
            }
          />
        </SectionCard>

        {/* Payment */}
        <SectionCard icon={<CreditCardIcon />} title={t("paymentInfo.title")}>
          <FieldRow
            label={t("paymentInfo.totalAmount")}
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <MoneyIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography component="span" sx={{ fontWeight: 800, color: "success.main" }}>
                  {formatCurrency(booking.totalPrice ?? booking.payment?.amount ?? 0)}
                </Typography>
              </Stack>
            }
          />
          <Divider />
          <FieldRow
            label={t("paymentInfo.status")}
            value={
              <Chip
                size="small"
                label={booking.payment?.latestKnownStatus ?? t("paymentInfo.pendingStatus")}
                color={
                  booking.payment?.latestKnownStatus?.toLowerCase() === "captured" ||
                  booking.payment?.latestKnownStatus?.toLowerCase() === "paid"
                    ? "success"
                    : "default"
                }
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              />
            }
          />
          <FieldRow label={t("paymentInfo.method")} value={booking.payment?.paymentMethod ?? "—"} />
          <FieldRow label={t("paymentInfo.processedAt")} value={formatDateLong(booking.payment?.processedTimestamp)} />
        </SectionCard>
      </Box>
    </Box>
  );
}
