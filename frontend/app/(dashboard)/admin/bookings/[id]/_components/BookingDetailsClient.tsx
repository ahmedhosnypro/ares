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
  Skeleton,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  PaymentOutlined as PaymentIcon,
  HistoryOutlined as HistoryIcon,
  VerifiedOutlined as VerifiedIcon,
  PhoneOutlined as PhoneIcon,
  EmailOutlined as EmailIcon,
  BusinessOutlined as BusinessIcon,
  LocalGasStationOutlined as FuelIcon,
  SpeedOutlined as SpeedIcon,
  NotesOutlined as NotesIcon,
  PhotoLibraryOutlined as PhotoIcon,
  ReceiptLongOutlined as ReceiptIcon,
  RefreshOutlined as RefreshIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CancelOutlined as CancelIcon,
  PaidOutlined as PaidIcon,
  AssignmentIndOutlined as AssignIcon,
  HourglassEmptyOutlined as HourglassIcon,
  ScheduleOutlined as ScheduleIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getAdminBookingDetails,
  deleteBookings as deleteBookingsApi,
  type Booking,
  type BookingInspectionFull,
  type BookingTimelineEvent,
} from "@/api-clients/bookings/bookings";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { toApiUrl } from "@/utils/api-client";
import ChangeStatusModal from "../../_components/ChangeStatusModal";
import BookingInspectionPanel from "../../_components/BookingInspectionPanel";

/* ────────────────────────────────────────────────────────────────────────
 *  RefundSection Component
 * ──────────────────────────────────────────────────────────────────────── */

interface RefundSectionProps {
  readonly bookingId: string;
  readonly paymentAmount: number;
  readonly accessToken: string;
  readonly onRefunded: () => void;
}

function RefundSection({ bookingId, paymentAmount, accessToken, onRefunded }: RefundSectionProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [refundPercentage, setRefundPercentage] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [policyType, setPolicyType] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setPreviewError(null);
    setLoadingPreview(true);
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/cancel-preview`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not load refund preview");
      const data = (await res.json()) as { refundPercentage: number; refundAmount: number; policyType: string };
      setRefundPercentage(data.refundPercentage);
      setRefundAmount(data.refundAmount);
      setPolicyType(data.policyType);
      setCustomAmount(data.refundAmount.toFixed(2));
    } catch (err) {
      logger.error("Refund preview error", err);
      setPreviewError("Could not load refund preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const amount = parseFloat(customAmount);
      const res = await fetch(toApiUrl(`/api/payments/${bookingId}/refund`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ amount: amount > 0 ? amount : null }),
      });
      if (!res.ok) throw new Error("Refund failed");
      setOpen(false);
      onRefunded();
    } catch (err) {
      logger.error("Refund error", err);
      setPreviewError("Refund failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={() => void handleOpen()} fullWidth>
        Process Refund
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Process Refund</DialogTitle>
        <DialogContent>
          {loadingPreview && (
            <Stack sx={{ alignItems: "center", py: 3 }} spacing={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Loading refund calculator…
              </Typography>
            </Stack>
          )}
          {previewError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {previewError}
            </Alert>
          )}
          {!loadingPreview && !previewError && (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Policy
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                  {policyType}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Algorithm Percentage
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {refundPercentage}%
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Suggested Refund
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ${refundAmount.toFixed(2)}
                </Typography>
              </Stack>
              <Divider />
              <TextField
                label="Refund Amount"
                type="number"
                value={customAmount}
                onChange={e => {
                  setCustomAmount(e.target.value);
                }}
                fullWidth
                helperText={`Max: $${paymentAmount.toFixed(2)}`}
                slotProps={{ htmlInput: { min: 0, max: paymentAmount, step: 0.01 } }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpen(false);
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void handleConfirm()}
            disabled={processing || loadingPreview || !!previewError}
            startIcon={processing ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {processing ? "Processing…" : "Confirm Refund"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 *  Formatters
 * ──────────────────────────────────────────────────────────────────────── */

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

const formatDateTime = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatCurrency = (n?: number | null, currency = "USD") => {
  if (n == null || isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};

const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "active" || s === "confirmed" || s === "approved") return "success" as const;
  if (s === "completed") return "info" as const;
  if (s === "cancelled" || s === "rejected" || s === "failed") return "error" as const;
  return "warning" as const;
};

const getPaymentStatusConfig = (status?: string | null) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed" || s === "captured" || s === "paid" || s === "authorized") return "success" as const;
  if (s === "failed" || s === "refunded") return "error" as const;
  if (s === "pending" || s === "processing") return "warning" as const;
  return "default" as const;
};

/* ────────────────────────────────────────────────────────────────────────
 *  Reusable building blocks
 * ──────────────────────────────────────────────────────────────────────── */

interface SectionCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, action, children }: SectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>
      <Box>{children}</Box>
    </Paper>
  );
}

interface InfoItemProps {
  readonly label: string;
  readonly value?: React.ReactNode;
  readonly icon?: React.ReactNode;
}

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, display: "block", mb: 0.5 }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        {icon}
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }} component="div">
          {value ?? "—"}
        </Typography>
      </Stack>
    </Box>
  );
}

function InfoGrid({ children, columns = 2 }: { readonly children: React.ReactNode; readonly columns?: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: columns >= 2 ? "1fr 1fr" : "1fr",
          md: `repeat(${String(columns)}, minmax(0, 1fr))`,
        },
      }}
    >
      {children}
    </Box>
  );
}

interface EmptyStateProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Stack
      spacing={1.5}
      sx={{
        alignItems: "center",
        textAlign: "center",
        py: 4,
        px: 2,
        borderRadius: 2,
        bgcolor: theme => alpha(theme.palette.text.primary, 0.02),
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          bgcolor: theme => alpha(theme.palette.text.primary, 0.05),
          color: "text.secondary",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {description}
      </Typography>
    </Stack>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 *  Inspection card
 * ──────────────────────────────────────────────────────────────────────── */

interface InspectionCardProps {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly inspection?: BookingInspectionFull | null;
  readonly fallbackAssignedInspectorName?: string | null;
  readonly fallbackStatus?: string | null;
}

function InspectionCard({
  title,
  icon,
  inspection,
  fallbackAssignedInspectorName,
  fallbackStatus,
}: InspectionCardProps) {
  // No row in DB and no inspector mirror — show empty state.
  if (!inspection && !fallbackAssignedInspectorName && !fallbackStatus) {
    return (
      <SectionCard icon={icon} title={title}>
        <EmptyState
          icon={<InspectionIcon />}
          title="No inspection yet"
          description="This inspection has not been performed. Assign an inspector to start the process."
        />
      </SectionCard>
    );
  }

  const statusValue = inspection?.status ?? fallbackStatus ?? "Pending";
  const inspectorName = inspection?.inspectorName ?? fallbackAssignedInspectorName ?? "—";

  return (
    <SectionCard
      icon={icon}
      title={title}
      action={
        <Chip
          size="small"
          label={statusValue}
          color={getStatusConfig(statusValue)}
          sx={{ fontWeight: 700, textTransform: "capitalize" }}
        />
      }
    >
      <Stack spacing={2.5}>
        <InfoGrid columns={2}>
          <InfoItem label="Assigned Inspector" value={inspectorName} icon={<AssignIcon sx={{ fontSize: 16 }} />} />
          <InfoItem
            label="Inspection Date"
            value={inspection ? formatDateTime(inspection.inspectionDate) : "—"}
            icon={<EventIcon sx={{ fontSize: 16 }} />}
          />
          <InfoItem
            label="Submitted At"
            value={inspection?.submittedAt ? formatDateTime(inspection.submittedAt) : "Not submitted"}
            icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
          />
          <InfoItem
            label="Condition"
            value={inspection?.generalCondition ?? "—"}
            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          />
          <InfoItem
            label="Mileage"
            value={inspection ? `${inspection.odometerReading.toLocaleString()} km` : "—"}
            icon={<SpeedIcon sx={{ fontSize: 16 }} />}
          />
          <InfoItem
            label="Fuel Level"
            value={inspection ? `${inspection.fuelLevel.toFixed(0)}%` : "—"}
            icon={<FuelIcon sx={{ fontSize: 16 }} />}
          />
        </InfoGrid>

        {inspection?.notes && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, display: "block", mb: 1 }}
            >
              <NotesIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} />
              Condition Notes
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2, bgcolor: theme => alpha(theme.palette.text.primary, 0.02) }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {inspection.notes}
              </Typography>
            </Paper>
          </Box>
        )}

        {inspection && inspection.imageUrls.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, display: "block", mb: 1 }}
            >
              <PhotoIcon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }} />
              Inspection Images ({inspection.imageUrls.length})
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
              }}
            >
              {inspection.imageUrls.map((url, idx) => {
                const src = toImageUrl(url);
                return (
                  <Box
                    key={`${url}-${String(idx)}`}
                    component="a"
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      position: "relative",
                      paddingTop: "75%",
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "block",
                      cursor: "pointer",
                      transition: "transform 120ms ease",
                      "&:hover": { transform: "scale(1.02)" },
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Inspection ${String(idx + 1)}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 *  Timeline
 * ──────────────────────────────────────────────────────────────────────── */

function timelineIcon(type: string) {
  switch (type) {
    case "BookingCreated":
      return <ReceiptIcon fontSize="small" />;
    case "InspectorAssigned":
      return <AssignIcon fontSize="small" />;
    case "PickupInspectionCompleted":
    case "ReturnInspectionCompleted":
      return <InspectionIcon fontSize="small" />;
    case "PaymentCompleted":
      return <PaidIcon fontSize="small" />;
    case "BookingCompleted":
      return <CheckCircleIcon fontSize="small" />;
    case "BookingCancelled":
      return <CancelIcon fontSize="small" />;
    case "RefundProcessed":
      return <PaymentIcon fontSize="small" />;
    default:
      return <HistoryIcon fontSize="small" />;
  }
}

function timelineColor(type: string): "primary" | "success" | "warning" | "error" | "info" {
  switch (type) {
    case "BookingCreated":
      return "info";
    case "InspectorAssigned":
      return "primary";
    case "PickupInspectionCompleted":
    case "ReturnInspectionCompleted":
      return "primary";
    case "PaymentCompleted":
    case "BookingCompleted":
      return "success";
    case "BookingCancelled":
      return "error";
    case "RefundProcessed":
      return "warning";
    default:
      return "primary";
  }
}

function TimelineList({ events }: { readonly events: BookingTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<HistoryIcon />}
        title="No activity yet"
        description="Activity will appear here as the booking progresses."
      />
    );
  }

  return (
    <Stack spacing={0}>
      {events.map((evt, idx) => {
        const isLast = idx === events.length - 1;
        const color = timelineColor(evt.type);
        return (
          <Stack key={`${evt.type}-${evt.occurredAt}-${String(idx)}`} direction="row" spacing={2}>
            <Stack sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme => alpha(theme.palette[color].main, 0.12),
                  color: `${color}.main`,
                  flexShrink: 0,
                }}
              >
                {timelineIcon(evt.type)}
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 28,
                    bgcolor: "divider",
                    my: 0.5,
                  }}
                />
              )}
            </Stack>
            <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {evt.title}
              </Typography>
              {evt.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {evt.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {formatDateTime(evt.occurredAt)}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 *  Skeletons
 * ──────────────────────────────────────────────────────────────────────── */

function DetailsSkeleton() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1240, mx: "auto" }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 4 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={240} height={36} />
          <Skeleton variant="text" width={180} height={20} />
        </Box>
        <Skeleton variant="rounded" width={320} height={40} />
      </Stack>
      <Stack spacing={3}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant="rounded" height={180} />
        ))}
      </Stack>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 *  Main Client Component
 * ──────────────────────────────────────────────────────────────────────── */

export default function BookingDetailsClient({ bookingId }: { readonly bookingId: string }) {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadBooking = async (showFullSpinner = true) => {
    if (!session?.accessToken) return;
    if (showFullSpinner) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getAdminBookingDetails(session.accessToken, bookingId);
      setBooking(data);
    } catch (e) {
      logger.error("Failed to load booking details", e);
      setError(e instanceof Error ? e.message : "Failed to load booking details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadBooking(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return <DetailsSkeleton />;
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
  const carSupplier = booking.car?.supplier ?? booking.supplier ?? null;
  const supplierDisplayName = carSupplier?.companyName ?? carSupplier?.name ?? carSupplier?.fullName ?? "—";
  const customerVerificationStatus = booking.customer?.verificationStatus;
  const currency = booking.paymentDetails?.currency ?? "USD";

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1240, mx: "auto" }}>
      {/* ── COMPACT HEADER ── */}
      <BookingDetailsHeader
        booking={booking}
        statusColorKey={statusColorKey}
        refreshing={refreshing}
        deleting={deleting}
        onLoadBooking={loadBooking}
        onSetStatusModalOpen={setStatusModalOpen}
        onDelete={handleDelete}
      />

      {/* ── VERTICAL SECTIONS ── */}
      <Stack spacing={3}>
        {/* 1. Booking Information */}
        <SectionCard
          icon={<EventIcon />}
          title="Booking Information"
          subtitle="Operational dates, locations and totals"
        >
          <InfoGrid columns={3}>
            <InfoItem label="Booking Number" value={booking.bookingNumber ?? "—"} />
            <InfoItem
              label="Status"
              value={
                <Chip
                  size="small"
                  label={booking.status}
                  color={statusColorKey}
                  sx={{ fontWeight: 700, textTransform: "capitalize" }}
                />
              }
            />
            <InfoItem
              label="Total Days"
              value={booking.totalDays != null ? `${String(booking.totalDays)} days` : "—"}
            />
            <InfoItem label="Pickup Date" value={formatDateLong(booking.from)} />
            <InfoItem label="Return Date" value={formatDateLong(booking.to)} />
            <InfoItem
              label="Total Amount"
              value={
                <Typography component="span" sx={{ fontWeight: 800, color: "success.main" }}>
                  {formatCurrency(booking.price ?? 0, currency)}
                </Typography>
              }
              icon={<MoneyIcon sx={{ fontSize: 16, color: "success.main" }} />}
            />
            <InfoItem
              label="Pickup Location"
              value={booking.pickupLocation?.name ?? "—"}
              icon={<PlaceIcon sx={{ fontSize: 16 }} />}
            />
            <InfoItem
              label="Dropoff Location"
              value={booking.dropOffLocation?.name ?? "—"}
              icon={<PlaceIcon sx={{ fontSize: 16 }} />}
            />
            <InfoItem label="Created Date" value={formatDateTime(booking.createdAt ?? null)} />
            <InfoItem label="Last Updated" value={formatDateTime(booking.updatedAt ?? null)} />
          </InfoGrid>
        </SectionCard>

        {/* 2. Customer Information */}
        <SectionCard icon={<PersonIcon />} title="Customer Information" subtitle="Renter contact details">
          {booking.customer ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: { sm: "flex-start" } }}>
              <Avatar
                src={toImageUrl(booking.customer.profileImage)}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {booking.customer.fullName.charAt(0).toUpperCase() || "?"}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {booking.customer.fullName || booking.customerName || "—"}
                  </Typography>
                  {booking.customer.isEmailVerified && (
                    <Chip
                      size="small"
                      icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                      label="Email Verified"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  {customerVerificationStatus && (
                    <Chip
                      size="small"
                      label={`ID: ${customerVerificationStatus}`}
                      color={getStatusConfig(customerVerificationStatus)}
                      variant="outlined"
                      sx={{ fontWeight: 600, textTransform: "capitalize" }}
                    />
                  )}
                </Stack>
                <InfoGrid columns={2}>
                  <InfoItem
                    label="Email"
                    value={booking.customer.email ?? "—"}
                    icon={<EmailIcon sx={{ fontSize: 16 }} />}
                  />
                  <InfoItem
                    label="Phone Number"
                    value={booking.customer.phone ?? "—"}
                    icon={<PhoneIcon sx={{ fontSize: 16 }} />}
                  />
                </InfoGrid>
              </Box>
            </Stack>
          ) : (
            <EmptyState
              icon={<PersonIcon />}
              title="No customer attached"
              description="This booking does not have a customer record."
            />
          )}
        </SectionCard>

        {/* 3. Vehicle Information (includes supplier) */}
        <SectionCard icon={<CarIcon />} title="Vehicle Information" subtitle="Vehicle details and supplier">
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: { sm: "flex-start" } }}>
              <Box
                sx={{
                  width: { xs: "100%", sm: 200 },
                  height: { xs: 160, sm: 130 },
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {booking.car?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toImageUrl(booking.car.image)}
                    alt={booking.car.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <CarIcon sx={{ fontSize: 64, color: "primary.main", opacity: 0.4 }} />
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {booking.car?.name ?? "—"}
                  </Typography>
                  {booking.car?.availabilityStatus && (
                    <Chip
                      size="small"
                      label={booking.car.availabilityStatus}
                      color={getStatusConfig(booking.car.availabilityStatus)}
                      variant="outlined"
                      sx={{ fontWeight: 600, textTransform: "capitalize" }}
                    />
                  )}
                </Stack>
                <InfoGrid columns={3}>
                  <InfoItem label="Make" value={booking.car?.make ?? "—"} />
                  <InfoItem label="Model" value={booking.car?.model ?? "—"} />
                  <InfoItem label="Year" value={booking.car?.year ?? "—"} />
                  <InfoItem label="License Plate" value={booking.car?.plateNumber ?? "—"} />
                  <InfoItem
                    label="Daily Rate"
                    value={formatCurrency(booking.car?.dailyRate ?? booking.dailyRate ?? null, currency)}
                  />
                  <InfoItem label="Availability" value={booking.car?.availabilityStatus ?? "—"} />
                </InfoGrid>
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
                <BusinessIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Supplier
                </Typography>
              </Stack>
              <InfoGrid columns={2}>
                <InfoItem label="Supplier Name" value={carSupplier?.fullName ?? carSupplier?.name ?? "—"} />
                <InfoItem label="Company Name" value={carSupplier?.companyName ?? supplierDisplayName} />
                <InfoItem label="Email" value={carSupplier?.email ?? "—"} icon={<EmailIcon sx={{ fontSize: 16 }} />} />
                <InfoItem
                  label="Phone Number"
                  value={carSupplier?.phone ?? "—"}
                  icon={<PhoneIcon sx={{ fontSize: 16 }} />}
                />
              </InfoGrid>
            </Box>
          </Stack>
        </SectionCard>

        {/* 4. Payment Information */}
        <SectionCard
          icon={<PaymentIcon />}
          title="Payment Information"
          subtitle="Latest payment and refund details"
          action={
            booking.paymentStatus && (
              <Chip
                size="small"
                label={booking.paymentStatus}
                color={getPaymentStatusConfig(booking.paymentStatus)}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              />
            )
          }
        >
          {booking.paymentDetails ? (
            <Stack spacing={2.5}>
              {/* Refund button — only when payment is Captured */}
              {booking.paymentDetails.status.toLowerCase() === "captured" && (
                <RefundSection
                  bookingId={bookingId}
                  paymentAmount={booking.paymentDetails.amount}
                  accessToken={session?.accessToken ?? ""}
                  onRefunded={() => {
                    void loadBooking(false);
                  }}
                />
              )}
              <InfoGrid columns={3}>
                <InfoItem
                  label="Payment Status"
                  value={
                    <Chip
                      size="small"
                      label={booking.paymentDetails.status}
                      color={getPaymentStatusConfig(booking.paymentDetails.status)}
                      sx={{ fontWeight: 700, textTransform: "capitalize" }}
                    />
                  }
                />
                <InfoItem
                  label="Amount"
                  value={
                    <Typography component="span" sx={{ fontWeight: 800, color: "success.main" }}>
                      {formatCurrency(booking.paymentDetails.amount, booking.paymentDetails.currency)}
                    </Typography>
                  }
                />
                <InfoItem label="Currency" value={booking.paymentDetails.currency} />
                <InfoItem label="Payment Method" value={booking.paymentDetails.method || "—"} />
                <InfoItem
                  label="Transaction Reference"
                  value={
                    booking.paymentDetails.transactionId ? (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          bgcolor: theme => alpha(theme.palette.text.primary, 0.05),
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.75,
                        }}
                      >
                        {booking.paymentDetails.transactionId}
                      </Typography>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoItem label="Authorization Code" value={booking.paymentDetails.authorizationCode ?? "—"} />
                <InfoItem label="Paid Date" value={formatDateTime(booking.paymentDetails.processedAt)} />
                <InfoItem label="Created" value={formatDateTime(booking.paymentDetails.createdAt)} />
                {booking.paymentDetails.failureReason && (
                  <InfoItem
                    label="Failure Reason"
                    value={
                      <Typography component="span" color="error.main">
                        {booking.paymentDetails.failureReason}
                      </Typography>
                    }
                  />
                )}
              </InfoGrid>

              {(booking.paymentDetails.refundAmount != null ||
                booking.paymentDetails.refundStatus ||
                booking.paymentDetails.refundProcessedAt) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Refund
                    </Typography>
                    <InfoGrid columns={3}>
                      <InfoItem
                        label="Refund Amount"
                        value={
                          booking.paymentDetails.refundAmount != null
                            ? formatCurrency(booking.paymentDetails.refundAmount, booking.paymentDetails.currency)
                            : "—"
                        }
                      />
                      <InfoItem
                        label="Refund Status"
                        value={
                          booking.paymentDetails.refundStatus ? (
                            <Chip
                              size="small"
                              label={booking.paymentDetails.refundStatus}
                              color={getStatusConfig(booking.paymentDetails.refundStatus)}
                              variant="outlined"
                              sx={{ fontWeight: 600, textTransform: "capitalize" }}
                            />
                          ) : (
                            "—"
                          )
                        }
                      />
                      <InfoItem label="Refund Method" value={booking.paymentDetails.refundMethod ?? "—"} />
                      <InfoItem label="Refund Date" value={formatDateTime(booking.paymentDetails.refundProcessedAt)} />
                    </InfoGrid>
                  </Box>
                </>
              )}
            </Stack>
          ) : (
            <EmptyState
              icon={<PaymentIcon />}
              title="No payment recorded yet"
              description="When a payment is processed for this booking it will appear here."
            />
          )}
        </SectionCard>

        {/* 5. Inspection Management */}
        {(booking.status === "Confirmed" || booking.status === "Active") && (
          <BookingInspectionPanel
            bookingId={booking.id}
            bookingStatus={booking.status}
            initialInspectorId={booking.inspection?.assignedInspectorId}
            initialInspectionStatus={booking.inspectionStatus || booking.inspection?.preInspectionStatus}
            onAssignSuccess={() => void loadBooking(false)}
          />
        )}

        {/* 6. Pickup Inspection */}
        {(booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") &&
          (booking.pickupInspection || booking.inspection?.assignedInspectorId) && (
            <InspectionCard
              title="Pickup Inspection"
              icon={<InspectionIcon />}
              inspection={booking.pickupInspection}
              fallbackAssignedInspectorName={
                booking.pickupInspection?.inspectorName ?? booking.inspection?.assignedInspectorName ?? null
              }
              fallbackStatus={booking.pickupInspection?.status ?? booking.inspection?.preInspectionStatus ?? null}
            />
          )}

        {/* 7. Return Inspection */}
        {(booking.status === "Active" || booking.status === "Completed") &&
          (booking.returnInspection || booking.inspection?.assignedInspectorId) && (
            <InspectionCard
              title="Return Inspection"
              icon={<InspectionIcon />}
              inspection={booking.returnInspection}
              fallbackAssignedInspectorName={booking.returnInspection?.inspectorName ?? null}
              fallbackStatus={booking.returnInspection?.status ?? booking.inspection?.postInspectionStatus ?? null}
            />
          )}

        {/* 7. Activity Timeline */}
        <SectionCard icon={<HistoryIcon />} title="Activity Timeline" subtitle="Real events recorded for this booking">
          {booking.timeline && booking.timeline.length > 0 ? (
            <TimelineList events={booking.timeline} />
          ) : (
            <EmptyState
              icon={<HourglassIcon />}
              title="No timeline events"
              description="As the booking progresses through its lifecycle, activity will be captured here."
            />
          )}
        </SectionCard>
      </Stack>

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
          // Reload to pick up any new timeline / payment events
          void loadBooking(false);
        }}
      />
    </Box>
  );
}

interface BookingDetailsHeaderProps {
  readonly booking: Booking;
  readonly statusColorKey: "primary" | "secondary" | "error" | "info" | "success" | "warning" | "default";
  readonly refreshing: boolean;
  readonly deleting: boolean;
  readonly onLoadBooking: (showFullSpinner?: boolean) => Promise<void>;
  readonly onSetStatusModalOpen: (open: boolean) => void;
  readonly onDelete: () => void;
}

function BookingDetailsHeader({
  booking,
  statusColorKey,
  refreshing,
  deleting,
  onLoadBooking,
  onSetStatusModalOpen,
  onDelete,
}: BookingDetailsHeaderProps) {
  const router = useRouter();
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
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
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Booking #{booking.bookingNumber ?? booking.id.split("-")[0]}
              </Typography>
              <Chip
                size="small"
                label={booking.status}
                color={statusColorKey}
                sx={{ fontWeight: 700, textTransform: "capitalize" }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Last updated {formatDateTime(booking.updatedAt ?? booking.createdAt ?? null)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Tooltip title="Refresh">
            <span>
              <IconButton
                onClick={() => {
                  void onLoadBooking(false);
                }}
                disabled={refreshing}
                sx={{ border: "1px solid", borderColor: "divider" }}
              >
                {refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
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
              onSetStatusModalOpen(true);
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
            onClick={onDelete}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
