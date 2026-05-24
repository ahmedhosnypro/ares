"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
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
        borderRadius: 3,
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
            setError("Booking not found, or you don't have permission to view it.");
          } else if (e.status === 401) {
            setError("Your session has expired. Please sign in again.");
          } else if (e.status === 403) {
            setError("You don't have permission to view this booking.");
          } else {
            setError(`Failed to load booking details (${String(e.status)}).`);
          }
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to load booking details.");
        }
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [bookingId, session?.accessToken]);

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
        <Alert severity="error">{error ?? "Booking not found."}</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => {
            router.push("/supplier/bookings");
          }}
        >
          Back to Bookings
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
          <Tooltip title="Back to bookings">
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
              Booking #{shortRef}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
              <Chip
                size="small"
                label={booking.status ?? "Pending"}
                color={statusColorKey}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              />
              <Typography variant="body2" color="text.secondary">
                Created {formatDateLong(booking.createdAt)}
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
        <SectionCard icon={<PersonIcon />} title="Customer Information">
          <FieldRow label="Name" value={booking.customer?.name ?? "—"} />
          <FieldRow label="Email" value={booking.customer?.email ?? "—"} />
          <FieldRow label="Phone" value={booking.customer?.phone ?? "—"} />
        </SectionCard>

        {/* Vehicle */}
        <SectionCard icon={<CarIcon />} title="Vehicle Information">
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
                Plate: {booking.vehicle?.licensePlate ?? "—"}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        {/* Booking */}
        <SectionCard icon={<EventIcon />} title="Booking Information">
          <FieldRow label="Pickup Date" value={formatDateLong(booking.pickupDate)} />
          <FieldRow label="Return Date" value={formatDateLong(booking.returnDate)} />
          <FieldRow label="Total Days" value={booking.totalDays != null ? `${String(booking.totalDays)} days` : "—"} />
          <Divider />
          <FieldRow
            label="Pickup Location"
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <span>{booking.pickupLocation?.name ?? "—"}</span>
              </Stack>
            }
          />
          <FieldRow
            label="Dropoff Location"
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <span>{booking.dropOffLocation?.name ?? "—"}</span>
              </Stack>
            }
          />
        </SectionCard>

        {/* Payment */}
        <SectionCard icon={<CreditCardIcon />} title="Payment Information">
          <FieldRow
            label="Total Amount"
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
            label="Status"
            value={
              <Chip
                size="small"
                label={booking.payment?.latestKnownStatus ?? "Pending"}
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
          <FieldRow label="Method" value={booking.payment?.paymentMethod ?? "—"} />
          <FieldRow label="Processed At" value={formatDateLong(booking.payment?.processedTimestamp)} />
        </SectionCard>
      </Box>
    </Box>
  );
}
