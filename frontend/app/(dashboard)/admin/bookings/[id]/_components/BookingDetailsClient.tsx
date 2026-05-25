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
  EditOutlined as EditIcon,
  SyncAltOutlined as ChangeStatusIcon,
  DeleteOutlined as DeleteIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PlaceOutlined as PlaceIcon,
  EventOutlined as EventIcon,
  AssignmentTurnedInOutlined as InspectionIcon,
  PersonOutlineRounded as PersonIcon,
  AttachMoneyRounded as MoneyIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getAdminBookingDetails,
  deleteBookings as deleteBookingsApi,
  type Booking,
} from "@/api-clients/bookings/bookings";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import ChangeStatusModal from "../../_components/ChangeStatusModal";

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
  if (s === "active" || s === "confirmed") return "success" as const;
  if (s === "completed") return "info" as const;
  if (s === "cancelled") return "error" as const;
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
      <Typography variant="body2" component="div" sx={{ fontWeight: 600, textAlign: "right" }}>
        {value ?? "—"}
      </Typography>
    </Stack>
  );
}

export default function BookingDetailsClient({ bookingId }: { readonly bookingId: string }) {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!session?.accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminBookingDetails(session.accessToken, bookingId);
        setBooking(data);
      } catch (e) {
        logger.error("Failed to load booking details", e);
        setError(e instanceof Error ? e.message : "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [bookingId, session?.accessToken]);

  const handleDelete = () => {
    void (async () => {
      if (!session?.accessToken || !booking) return;
      if (!window.confirm("Delete this booking? This action cannot be undone.")) return;
      setDeleting(true);
      try {
        await deleteBookingsApi(session.accessToken, [booking.id]);
        router.push("/admin/bookings");
      } catch (e) {
        logger.error("Failed to delete booking", e);
        setError(e instanceof Error ? e.message : "Failed to delete booking.");
      } finally {
        setDeleting(false);
      }
    })();
  };

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
            router.push("/admin/bookings");
          }}
        >
          Back to Bookings
        </Button>
      </Box>
    );
  }

  const statusColorKey = getStatusConfig(booking.status);

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
                router.push("/admin/bookings");
              }}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Booking #{booking.bookingNumber ?? booking.id.split("-")[0]}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
              <Chip
                size="small"
                label={booking.status}
                color={statusColorKey}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              />
              <Typography variant="body2" color="text.secondary">
                Last updated {formatDateLong(booking.updatedAt ?? booking.createdAt ?? null)}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              router.push(`/admin/bookings/${booking.id}/edit`);
            }}
            sx={{ borderRadius: 2 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<ChangeStatusIcon />}
            onClick={() => {
              setStatusModalOpen(true);
            }}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Change Status
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleting}
            onClick={handleDelete}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
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
          <FieldRow label="Name" value={booking.customer?.fullName ?? booking.customerName ?? "—"} />
          <FieldRow label="Email" value={booking.customer?.email ?? "—"} />
          <FieldRow label="Phone" value={booking.customer?.phone ?? "—"} />
        </SectionCard>

        {/* Vehicle */}
        <SectionCard icon={<CarIcon />} title="Vehicle Information">
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Avatar
              variant="rounded"
              src={toImageUrl(booking.car?.image)}
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
              <Typography sx={{ fontWeight: 700 }}>{booking.car?.name ?? "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Plate: {booking.car?.plateNumber ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supplier: {booking.supplier?.name ?? booking.supplier?.fullName ?? "—"}
              </Typography>
            </Box>
          </Stack>
          <Divider />
          <FieldRow label="Daily Rate" value={formatCurrency(booking.car?.dailyRate ?? booking.dailyRate ?? null)} />
        </SectionCard>

        {/* Booking */}
        <SectionCard icon={<EventIcon />} title="Booking Information">
          <FieldRow label="Pickup Date" value={formatDateLong(booking.from)} />
          <FieldRow label="Return Date" value={formatDateLong(booking.to)} />
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
          <Divider />
          <FieldRow
            label="Total Amount"
            value={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                <MoneyIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography component="span" sx={{ fontWeight: 800, color: "success.main" }}>
                  {formatCurrency(booking.price ?? 0)}
                </Typography>
              </Stack>
            }
          />
        </SectionCard>

        {/* Inspection Overview — lightweight only */}
        <SectionCard icon={<InspectionIcon />} title="Inspection Overview">
          {booking.inspection ? (
            <>
              <FieldRow
                label="Pre-Inspection"
                value={
                  <Chip
                    size="small"
                    label={booking.inspection.preInspectionStatus ?? "Not Required"}
                    color={booking.inspection.preInspectionStatus === "Approved" ? "success" : "default"}
                    sx={{ fontWeight: 600, textTransform: "capitalize" }}
                  />
                }
              />
              <FieldRow
                label="Post-Inspection"
                value={
                  <Chip
                    size="small"
                    label={booking.inspection.postInspectionStatus ?? "Not Required"}
                    color={booking.inspection.postInspectionStatus === "Approved" ? "success" : "default"}
                    sx={{ fontWeight: 600, textTransform: "capitalize" }}
                  />
                }
              />
              <FieldRow label="Assigned Inspector" value={booking.inspection.assignedInspectorName ?? "—"} />
              <FieldRow label="Pre-Inspection Date" value={formatDateLong(booking.inspection.preInspectionDate)} />
              <FieldRow label="Post-Inspection Date" value={formatDateLong(booking.inspection.postInspectionDate)} />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No inspection assigned for this booking yet.
            </Typography>
          )}
        </SectionCard>
      </Box>

      {/* ── CHANGE STATUS MODAL ── */}
      <ChangeStatusModal
        open={statusModalOpen}
        bookingId={booking.id}
        currentStatus={booking.status}
        accessToken={session?.accessToken}
        onClose={() => {
          setStatusModalOpen(false);
        }}
        onSuccess={newStatus => {
          setBooking(prev => (prev ? { ...prev, status: newStatus } : prev));
        }}
      />
    </Box>
  );
}
