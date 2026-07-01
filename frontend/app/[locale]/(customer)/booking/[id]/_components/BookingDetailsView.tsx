"use client";

import Image from "next/image";
import { Link } from "@/shared/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
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
  VerifiedUser as VerifiedIcon,
  Engineering as InspectorIcon,
} from "@mui/icons-material";
import { toImageUrl } from "@/utils/image-url";
import { formatUtcDateTime, parseUtcDate } from "@/utils/dateTime";
import { type BookingDetails } from "./types";
import BookingReviewSection from "./BookingReviewSection";

import CancelBookingButton from "./CancelBookingButton";

interface BookingDetailsViewProps {
  readonly booking: BookingDetails;
  readonly routeBookingId: string;
  readonly canCancel: boolean;
  readonly onCancel: (formData: FormData) => Promise<void>;
  readonly accessToken?: string;
  readonly feedback?: {
    readonly severity: AlertColor;
    readonly message: string;
  };
}

function formatDate(input: string | undefined, locale: string, naText = "N/A"): string {
  if (!input) return naText;
  return formatUtcDateTime(
    input,
    locale,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    naText
  );
}

function formatCurrency(amount?: number, naText = "N/A"): string {
  if (typeof amount !== "number") {
    return naText;
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

  const fromDate = parseUtcDate(from);
  const toDate = parseUtcDate(to);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / msPerDay);

  return Number.isFinite(diffDays) && diffDays > 0 ? diffDays : null;
}

function getStatusColor(status?: string): "success" | "warning" | "error" | "default" {
  switch (status?.toLowerCase()) {
    case "active":
    case "completed":
      return "success";
    case "pending":
    case "paymentpending":
    case "confirmed":
    case "pendingapproval":
      return "warning";
    case "cancelled":
    case "rejected":
      return "error";
    default:
      return "default";
  }
}

function getStatusLabel(status: string | undefined, t: (key: string) => string): string {
  if (!status) return t("status.unknown");
  switch (status.toLowerCase()) {
    case "draft":
      return t("status.draft");
    case "paymentpending":
      return t("status.paymentPending");
    case "pendingapproval":
      return t("status.pendingApproval");
    case "confirmed":
      return t("status.confirmed");
    case "active":
      return t("status.active");
    case "completed":
      return t("status.completed");
    case "cancelled":
      return t("status.cancelled");
    case "expired":
      return t("status.expired");
    case "rejected":
      return t("status.rejected");
    case "cancelledbyadmin": // cspell:disable-line
      return t("status.cancelledByAdmin");
    default:
      return t("status.unknown");
  }
}

export default function BookingDetailsView({
  booking,
  routeBookingId,
  canCancel,
  onCancel,
  accessToken,
  feedback,
}: Readonly<BookingDetailsViewProps>) {
  const t = useTranslations("customer.bookingDetail");
  const locale = useLocale();
  const na = t("notAvailable");
  const fmtDate = (input?: string) => formatDate(input, locale, na);
  const bookingRef = booking.id ?? routeBookingId;
  const imageUrl = toImageUrl(booking.car?.image) ?? "/placeholder-car.jpg";
  const durationDays = getDurationDays(booking.from, booking.to);

  function getInspectionStatusStyles(status?: string) {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case "approved":
        return {
          bg: "status.completed.light",
          color: "status.completed.main",
          label: t("inspection.approved"),
        };
      case "pending":
        return {
          bg: "status.pending.light",
          color: "status.pending.main",
          label: t("inspection.pending"),
        };
      case "rejected":
        return {
          bg: "status.cancelled.light",
          color: "status.cancelled.main",
          label: t("inspection.rejected"),
        };
      default:
        return {
          bg: "action.hover",
          color: "text.secondary",
          label: status ?? t("inspection.notRequired"),
        };
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Box sx={{ mx: "auto", maxWidth: 1200, px: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800 }}>
              {t("overview.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("overview.refId", { ref: bookingRef })}
            </Typography>
          </Box>

          <Link href="/bookings" style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
            >
              {t("overview.backToBookings")}
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
                sx={{ fontWeight: 700 }}
              >
                {feedback.message}
              </Typography>
            </CardContent>
          </Paper>
        ) : null}

        {booking.status?.toLowerCase() === "pendingapproval" && (
          <Paper
            variant="outlined"
            sx={{
              mb: 3,
              borderColor: "status.pendingApproval.main",
              bgcolor: "status.pendingApproval.light",
              boxShadow: "shadow.card",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "status.pendingApproval.main", mb: 0.5 }}>
                {t("approval.pendingApprovalTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("approval.pendingApprovalMessage")}
              </Typography>
            </CardContent>
          </Paper>
        )}

        {booking.status?.toLowerCase() === "rejected" && (
          <Paper
            variant="outlined"
            sx={{
              mb: 3,
              borderColor: "status.cancelled.main",
              bgcolor: "status.cancelled.light",
              boxShadow: "shadow.card",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "status.cancelled.main", mb: 0.5 }}>
                {t("approval.rejectedTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("approval.rejectedMessage")}
              </Typography>
              {booking.rejectionReason && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {t("approval.rejectionReason")}:
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {booking.rejectionReason}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Paper>
        )}

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
                  alt={booking.car?.name ?? t("car.bookedCarAlt")}
                  fill
                  sizes="(max-width: 900px) 100vw, 66vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>

              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mb: 2, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                      {booking.car?.name ?? t("car.unknownCar")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t("car.supplier", { name: booking.car?.supplier?.fullName ?? na })}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                    <Chip
                      label={getStatusLabel(booking.status, t)}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                    <Chip
                      label={booking.payLater ? t("car.payLater") : t("car.prepaid")}
                      variant="outlined"
                      size="small"
                    />
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
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                          {t("location.pickup")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.pickupLocation?.name ?? na}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(booking.from)}
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
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                          {t("location.dropoff")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.dropOffLocation?.name ?? na}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(booking.to)}
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
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                      {t("driverInfo.title")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.driver?.fullName ?? na}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.driver?.email ?? t("driverInfo.noEmailAvailable")}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Paper>

            {booking.inspection ? (
              <Paper
                sx={{
                  mt: 3,
                  border: "1px solid",
                  borderColor: "border.main",
                  bgcolor: "background.paper",
                  boxShadow: "shadow.card",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
                    <Box sx={{ color: "primary.main", display: "flex" }}>
                      <VerifiedIcon fontSize="medium" />
                    </Box>
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800 }}>
                      {t("inspection.title")}
                    </Typography>
                  </Stack>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack direction="row" spacing={1.5}>
                        <Box sx={{ color: "text.secondary", display: "flex", pt: 0.25 }}>
                          <InspectorIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                            {t("inspection.assignedInspector")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {booking.inspection.assignedInspectorName ?? t("inspection.noInspectorAssigned")}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                          {t("inspection.preDelivery")}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {(() => {
                            const styles = getInspectionStatusStyles(booking.inspection.preInspectionStatus);
                            return (
                              <Chip
                                label={styles.label}
                                size="small"
                                sx={{
                                  bgcolor: styles.bg,
                                  color: styles.color,
                                  fontWeight: 700,
                                  border: "none",
                                }}
                              />
                            );
                          })()}
                        </Box>
                        {booking.inspection.preInspectionDate ? (
                          <Typography variant="caption" color="text.secondary">
                            {t("inspection.dateLabel")}: {fmtDate(booking.inspection.preInspectionDate)}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                          {t("inspection.postReturn")}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {(() => {
                            const styles = getInspectionStatusStyles(booking.inspection.postInspectionStatus);
                            return (
                              <Chip
                                label={styles.label}
                                size="small"
                                sx={{
                                  bgcolor: styles.bg,
                                  color: styles.color,
                                  fontWeight: 700,
                                  border: "none",
                                }}
                              />
                            );
                          })()}
                        </Box>
                        {booking.inspection.postInspectionDate ? (
                          <Typography variant="caption" color="text.secondary">
                            {t("inspection.dateLabel")}: {fmtDate(booking.inspection.postInspectionDate)}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Paper>
            ) : null}

            {accessToken ? (
              <BookingReviewSection
                bookingId={bookingRef}
                vehicleId={booking.car?.id}
                status={booking.status}
                accessToken={accessToken}
              />
            ) : null}
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
                <Typography variant="h6" color="text.primary" sx={{ mb: 2, fontWeight: 800 }}>
                  {t("summary.title")}
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <CarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t("summary.vehicle")}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                      {booking.car?.name ?? na}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <CalendarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t("summary.duration")}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                      {durationDays ? `${String(durationDays)} ${t("summary.days")}` : na}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 700 }}>
                    {t("summary.totalPrice")}
                  </Typography>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 900 }}>
                    {formatCurrency(booking.price, na)}
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  <Link href="/bookings" style={{ textDecoration: "none" }}>
                    <Button variant="outlined" fullWidth>
                      {t("summary.viewAllBookings")}
                    </Button>
                  </Link>
                  {accessToken ? (
                    <CancelBookingButton
                      bookingId={bookingRef}
                      canCancel={canCancel}
                      accessToken={accessToken}
                      onCancel={onCancel}
                    />
                  ) : (
                    <Button variant="contained" color="secondary" fullWidth disabled>
                      {canCancel ? t("cancelBooking.cancelBooking") : t("cancelBooking.cancellationUnavailable")}
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
