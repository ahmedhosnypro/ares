"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import { CancelOutlined as RejectIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { rejectBooking } from "@/api-clients/bookings/bookings";
import { logger } from "@/utils/logger";

interface RejectBookingDialogProps {
  readonly open: boolean;
  readonly bookingId: string;
  readonly bookingNumber?: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly accessToken?: string;
}

export default function RejectBookingDialog({
  open,
  bookingId,
  bookingNumber,
  onClose,
  onSuccess,
  accessToken,
}: RejectBookingDialogProps) {
  const t = useTranslations("dashboardAdmin.bookings");
  const tCommon = useTranslations("common");
  const theme = useTheme();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_REASON_LENGTH = 500;

  const handleReject = () => {
    void (async () => {
      if (!accessToken || submitting || !reason.trim()) return;
      setSubmitting(true);
      setError(null);
      try {
        await rejectBooking(accessToken, bookingId, reason.trim());
        setReason("");
        onSuccess();
        onClose();
      } catch (e) {
        logger.error("Failed to reject booking", e);
        setError(t("approvals.rejectError"));
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const handleClose = () => {
    if (!submitting) {
      setReason("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 420 } } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.12),
              color: "error.main",
            }}
          >
            <RejectIcon fontSize="small" />
          </Box>
          {t("approvals.rejectDialog.title")}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t("approvals.rejectDialog.content")}
          </Typography>
          {bookingNumber && (
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              #{bookingNumber}
            </Typography>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t("approvals.rejectDialog.reasonLabel")}
            placeholder={t("approvals.rejectDialog.reasonPlaceholder")}
            value={reason}
            onChange={e => {
              setReason(e.target.value);
            }}
            multiline
            minRows={3}
            maxRows={6}
            fullWidth
            required
            disabled={submitting}
            slotProps={{ htmlInput: { maxLength: MAX_REASON_LENGTH } }}
            helperText={`${String(reason.length)}/${String(MAX_REASON_LENGTH)}`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" disabled={submitting} onClick={handleClose} sx={{ borderRadius: 2 }}>
          {tCommon("cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={submitting || !reason.trim()}
          onClick={handleReject}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            minWidth: 120,
            bgcolor: theme.palette.error.main,
            "&:hover": { bgcolor: theme.palette.error.dark },
          }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : t("menu.rejectBooking")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
