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
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import { CheckCircleOutlined as ApproveIcon } from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { approveBooking } from "@/api-clients/bookings/bookings";
import { logger } from "@/utils/logger";

interface ApproveBookingDialogProps {
  readonly open: boolean;
  readonly bookingId: string;
  readonly bookingNumber?: string;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly accessToken?: string;
}

export default function ApproveBookingDialog({
  open,
  bookingId,
  bookingNumber,
  onClose,
  onSuccess,
  accessToken,
}: ApproveBookingDialogProps) {
  const t = useTranslations("dashboardAdmin.bookings");
  const tCommon = useTranslations("common");
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    void (async () => {
      if (!accessToken || submitting) return;
      setSubmitting(true);
      setError(null);
      try {
        await approveBooking(accessToken, bookingId);
        onSuccess();
        onClose();
      } catch (e) {
        logger.error("Failed to approve booking", e);
        setError(t("approvals.approveError"));
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) {
          setError(null);
          onClose();
        }
      }}
      slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 380 } } }}
    >
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
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: "success.main",
            }}
          >
            <ApproveIcon fontSize="small" />
          </Box>
          {t("approvals.approveDialog.title")}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {t("approvals.approveDialog.content")}
        </Typography>
        {bookingNumber && (
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
            #{bookingNumber}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" disabled={submitting} onClick={onClose} sx={{ borderRadius: 2 }}>
          {tCommon("cancel")}
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={handleApprove}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            minWidth: 120,
            bgcolor: theme.palette.success.main,
            "&:hover": { bgcolor: theme.palette.success.dark },
          }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : t("menu.approveBooking")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
