"use client";

import { useEffect, useMemo, useState } from "react";
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
  TextField,
  MenuItem,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import {
  ArrowBackRounded as BackIcon,
  SaveOutlined as SaveIcon,
  DirectionsCarFilledTwoTone as CarIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { getAdminBookingDetails, updateBooking, type Booking } from "@/api-clients/bookings/bookings";
import { logger } from "@/utils/logger";
import { toImageUrl } from "@/utils/image-url";

const OPERATIONAL_STATUSES = ["PaymentPending", "Confirmed", "Active", "Completed", "Cancelled"] as const;

const formatCurrency = (n?: number | null, locale = "en") => {
  if (n == null || isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
};

const toLocalDateInput = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  // YYYY-MM-DD for <input type="date">
  return d.toISOString().slice(0, 10);
};

interface FormState {
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  dropOffLocation: string;
  status: string;
}

export default function EditBookingClient({ bookingId }: { readonly bookingId: string }) {
  const t = useTranslations("dashboardAdmin.editBooking");
  const tDetails = useTranslations("dashboardAdmin.bookingDetails");
  const locale = useLocale();
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    pickupDate: "",
    returnDate: "",
    pickupLocation: "",
    dropOffLocation: "",
    status: "PaymentPending",
  });

  // ── Load booking ────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      if (!session?.accessToken || !bookingId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminBookingDetails(session.accessToken, bookingId);
        setBooking(data);
        setForm({
          pickupDate: toLocalDateInput(data.from),
          returnDate: toLocalDateInput(data.to),
          pickupLocation: data.pickupLocation?.name ?? "",
          dropOffLocation: data.dropOffLocation?.name ?? "",
          status: data.status,
        });
      } catch (e) {
        logger.error("Failed to load booking details", e);
        setError(e instanceof Error ? e.message : t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [bookingId, session?.accessToken, t]);

  // ── Derived: terminal state ─────────────────────────────────────────
  const isTerminal = useMemo(() => {
    const s = booking?.status.toLowerCase() ?? "";
    return s === "completed" || s === "cancelled";
  }, [booking?.status]);

  // ── Live recalculation ──────────────────────────────────────────────
  const dailyRate = booking?.car?.dailyRate ?? booking?.dailyRate ?? 0;
  const { totalDays, totalPrice, datesValid } = useMemo(() => {
    const p = form.pickupDate ? new Date(form.pickupDate) : null;
    const r = form.returnDate ? new Date(form.returnDate) : null;
    if (!p || !r || isNaN(p.getTime()) || isNaN(r.getTime()) || p >= r) {
      return { totalDays: 0, totalPrice: 0, datesValid: false };
    }
    const days = Math.round((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
    return { totalDays: days, totalPrice: days * dailyRate, datesValid: true };
  }, [form.pickupDate, form.returnDate, dailyRate]);

  const totalDaysLabel = useMemo(() => {
    if (!datesValid) return "—";
    return t("pricingSummary.daysValue", { count: totalDays });
  }, [datesValid, totalDays, t]);

  const isDirty = useMemo(() => {
    if (!booking) return false;
    return (
      form.pickupDate !== toLocalDateInput(booking.from) ||
      form.returnDate !== toLocalDateInput(booking.to) ||
      form.pickupLocation !== (booking.pickupLocation?.name ?? "") ||
      form.dropOffLocation !== (booking.dropOffLocation?.name ?? "") ||
      form.status !== booking.status
    );
  }, [booking, form]);

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSave = () => {
    void (async () => {
      if (!session?.accessToken || !booking) return;
      if (!datesValid) {
        setError(t("errors.dateError"));
        return;
      }

      setSaving(true);
      setError(null);
      try {
        const payload: {
          pickupDate?: string;
          returnDate?: string;
          pickupLocation?: string;
          dropOffLocation?: string;
          status?: string;
        } = {};

        if (form.pickupDate !== toLocalDateInput(booking.from)) {
          payload.pickupDate = new Date(form.pickupDate).toISOString();
        }
        if (form.returnDate !== toLocalDateInput(booking.to)) {
          payload.returnDate = new Date(form.returnDate).toISOString();
        }
        if (form.pickupLocation !== (booking.pickupLocation?.name ?? "")) {
          payload.pickupLocation = form.pickupLocation;
        }
        if (form.dropOffLocation !== (booking.dropOffLocation?.name ?? "")) {
          payload.dropOffLocation = form.dropOffLocation;
        }
        if (form.status !== booking.status) {
          payload.status = form.status;
        }

        const updated = await updateBooking(session.accessToken, bookingId, payload);
        setBooking(updated);
        router.push(`/admin/bookings/${bookingId}`);
      } catch (e) {
        logger.error("Failed to update booking", e);
        setError(e instanceof Error ? e.message : t("errors.saveFailed"));
      } finally {
        setSaving(false);
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

  if (!booking) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Alert severity="error">{error ?? t("errors.notFound")}</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => {
            router.push("/admin/bookings");
          }}
        >
          {t("buttons.backToBookings")}
        </Button>
      </Box>
    );
  }

  const editableFieldsDisabled = isTerminal || saving;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* ── HEADER ── */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, mb: 4 }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <IconButton
            onClick={() => {
              router.push(`/admin/bookings/${bookingId}`);
            }}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("pageTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              #{booking.bookingNumber ?? booking.id.split("-")[0]}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => {
              router.push(`/admin/bookings/${bookingId}`);
            }}
            sx={{ borderRadius: 2 }}
            disabled={saving}
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? undefined : <SaveIcon />}
            onClick={handleSave}
            disabled={!isDirty || !datesValid || isTerminal || saving}
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 160 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : t("buttons.saveChanges")}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isTerminal && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("notices.terminal", { status: tDetails(`badges.${booking.status.toLowerCase()}`) })}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <Stack spacing={3}>
          {/* Booking Summary — read-only */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t("bookingSummary.title")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
              <Avatar
                variant="rounded"
                src={toImageUrl(booking.car?.image)}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                }}
              >
                <CarIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{booking.car?.name ?? "—"}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("bookingSummary.plate", { plate: booking.car?.plateNumber ?? "—" })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("bookingSummary.supplier", { name: booking.supplier?.name ?? booking.supplier?.fullName ?? "—" })}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t("bookingSummary.customer")}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {booking.customer?.fullName ?? booking.customerName ?? "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking.customer?.email ?? "—"}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("bookingSummary.paymentStatus")}
                </Typography>
                <Box>
                  <Chip
                    size="small"
                    label={tDetails(`badges.${(booking.paymentStatus ?? "unpaid").toLowerCase()}`)}
                    color={booking.paymentStatus === "Paid" ? "success" : "default"}
                    sx={{ fontWeight: 600, mt: 0.5 }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("bookingSummary.dailyRate")}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(dailyRate, locale)}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Editable Booking Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t("editableInfo.title")}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <TextField
                type="date"
                label={t("editableInfo.pickupDate")}
                value={form.pickupDate}
                onChange={e => {
                  setForm(prev => ({ ...prev, pickupDate: e.target.value }));
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={editableFieldsDisabled}
                fullWidth
              />
              <TextField
                type="date"
                label={t("editableInfo.returnDate")}
                value={form.returnDate}
                onChange={e => {
                  setForm(prev => ({ ...prev, returnDate: e.target.value }));
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={editableFieldsDisabled}
                error={!datesValid && form.pickupDate !== "" && form.returnDate !== ""}
                helperText={
                  !datesValid && form.pickupDate !== "" && form.returnDate !== "" ? t("errors.returnDateError") : ""
                }
                fullWidth
              />
              <TextField
                label={t("editableInfo.pickupLocation")}
                value={form.pickupLocation}
                onChange={e => {
                  setForm(prev => ({ ...prev, pickupLocation: e.target.value }));
                }}
                disabled={editableFieldsDisabled}
                placeholder={t("editableInfo.pickupLocationPlaceholder")}
                fullWidth
              />
              <TextField
                label={t("editableInfo.dropoffLocation")}
                value={form.dropOffLocation}
                onChange={e => {
                  setForm(prev => ({ ...prev, dropOffLocation: e.target.value }));
                }}
                disabled={editableFieldsDisabled}
                placeholder={t("editableInfo.dropoffLocationPlaceholder")}
                fullWidth
              />
              <TextField
                select
                label={t("editableInfo.bookingStatus")}
                value={form.status}
                onChange={e => {
                  setForm(prev => ({ ...prev, status: e.target.value }));
                }}
                disabled={isTerminal || saving}
                fullWidth
              >
                {OPERATIONAL_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    {tDetails(`badges.${s.toLowerCase()}`)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Paper>
        </Stack>

        {/* ── RIGHT COLUMN: Pricing summary ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            height: "fit-content",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            {t("pricingSummary.title")}
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {t("pricingSummary.dailyRate")}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatCurrency(dailyRate, locale)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {t("pricingSummary.totalDays")}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{totalDaysLabel}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t("pricingSummary.totalPrice")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>
                {formatCurrency(totalPrice, locale)}
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, lineHeight: 1.5 }}>
            {t("notices.priceCalculation")}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
