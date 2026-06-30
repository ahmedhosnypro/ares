"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { updateBookingStatus } from "@/api-clients/bookings/bookings";
import { logger } from "@/utils/logger";

/**
 * The four operational statuses the backend's simple change-status flow
 * accepts. Anything else (Confirmed / inspection-workflow values) is
 * intentionally NOT exposed to the operator here.
 */
const OPERATIONAL_STATUSES = ["PaymentPending", "Confirmed", "Active", "Completed", "Cancelled"] as const;
type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

interface ChangeStatusModalProps {
  readonly open: boolean;
  readonly bookingId: string | null;
  readonly currentStatus?: string | null;
  readonly accessToken?: string;
  /** Called after a successful status change. */
  readonly onSuccess?: (newStatus: OperationalStatus) => void;
  /** Called on close (cancel or backdrop click). */
  readonly onClose: () => void;
}

/**
 * Lightweight Change-Status modal. Deliberately minimal: a four-button
 * status picker + Save / Cancel. No refunds, approvals, cancellation
 * forms, or notifications wiring — the backend handles operational
 * side-effects.
 */
export default function ChangeStatusModal({
  open,
  bookingId,
  currentStatus,
  accessToken,
  onSuccess,
  onClose,
}: ChangeStatusModalProps) {
  const t = useTranslations("dashboardAdmin.bookings");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<OperationalStatus | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const normalized = currentStatus ?? "";
      const match = OPERATIONAL_STATUSES.find(s => s.toLowerCase() === normalized.toLowerCase());
      setSelected(match ?? "");
      setError(null);
    }
  }, [open, currentStatus]);

  const handleSave = () => {
    void (async () => {
      if (!selected || !bookingId || !accessToken) return;
      setSubmitting(true);
      setError(null);
      try {
        await updateBookingStatus(accessToken, bookingId, selected);
        onSuccess?.(selected);
        onClose();
      } catch (e) {
        logger.error("Failed to change booking status", e);
        let displayError = t("alerts.changeStatusError");
        if (e instanceof Error) {
          displayError = e.message;
        }
        setError(displayError);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const getOperationalStatusLabel = (status: OperationalStatus) => {
    switch (status) {
      case "PaymentPending":
        return t("changeStatusModal.statuses.paymentPending");
      case "Confirmed":
        return t("changeStatusModal.statuses.confirmed");
      case "Active":
        return t("changeStatusModal.statuses.active");
      case "Completed":
        return t("changeStatusModal.statuses.completed");
      case "Cancelled":
        return t("changeStatusModal.statuses.cancelled");
      default:
        return status;
    }
  };

  const getStatusLabelText = (status?: string | null) => {
    if (!status) return "";
    const match = OPERATIONAL_STATUSES.find(s => s.toLowerCase() === status.toLowerCase());
    if (match) return getOperationalStatusLabel(match);
    return status;
  };

  const disabled = submitting || !selected || selected === currentStatus;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 380 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{t("changeStatusModal.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {currentStatus && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {t("changeStatusModal.currentLabel")}
              </Typography>
              <Chip
                size="small"
                label={getStatusLabelText(currentStatus)}
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              />
            </Stack>
          )}

          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("changeStatusModal.newStatusLabel")}
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={selected}
              onChange={(_, v: OperationalStatus | null) => {
                if (v) setSelected(v);
              }}
              fullWidth
              sx={{
                flexWrap: "wrap",
                gap: 1,
                "& .MuiToggleButton-root": {
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider !important",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  flex: "1 1 45%",
                },
              }}
            >
              {OPERATIONAL_STATUSES.map(s => (
                <ToggleButton key={s} value={s}>
                  {getOperationalStatusLabel(s)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" disabled={submitting} onClick={onClose} sx={{ borderRadius: 2 }}>
          {tCommon("cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={handleSave}
          sx={{ borderRadius: 2, fontWeight: 700, minWidth: 120 }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : tCommon("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
