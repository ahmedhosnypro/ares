"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface RefundPreview {
  refundPercentage: number;
  refundAmount: number;
  cancellationFee: number;
  policyType: string;
}

interface Props {
  readonly bookingId: string;
  readonly canCancel: boolean;
  readonly accessToken: string;
  readonly onCancel: (formData: FormData) => Promise<void>;
}

export default function CancelBookingButton({ bookingId, canCancel, accessToken, onCancel }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<RefundPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setPreviewError(null);
    setLoadingPreview(true);
    try {
      const res = await fetch(toApiUrl(`/api/bookings/${bookingId}/cancel-preview`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Could not load refund preview");
      const data = (await res.json()) as RefundPreview;
      setPreview(data);
    } catch (err) {
      logger.error("Refund preview error", err);
      setPreviewError("Could not calculate refund. You can still cancel.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = () => {
    setCancelling(true);
    const fd = new FormData();
    fd.append("bookingId", bookingId);
    void onCancel(fd).finally(() => {
      setCancelling(false);
    });
  };

  if (!canCancel) {
    return (
      <Button variant="contained" color="secondary" fullWidth disabled>
        Cancellation Unavailable
      </Button>
    );
  }

  return (
    <>
      <Button variant="contained" color="secondary" fullWidth onClick={() => void handleOpen()}>
        Cancel Booking
      </Button>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Cancel Booking</DialogTitle>
        <DialogContent>
          {loadingPreview && (
            <Stack sx={{ alignItems: "center", py: 3 }} spacing={1}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Calculating refund…
              </Typography>
            </Stack>
          )}
          {previewError && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              {previewError}
            </Alert>
          )}
          {preview && !loadingPreview && (
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Refund policy
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                  {preview.policyType}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Refund percentage
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {preview.refundPercentage}%
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Cancellation fee
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                  ${preview.cancellationFee.toFixed(2)}
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body1" sx={{ fontWeight: 800 }}>
                  You will receive
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 900, color: "success.main" }}>
                  ${preview.refundAmount.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
          )}
          {!loadingPreview && !preview && !previewError && (
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to cancel this booking?
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpen(false);
            }}
            disabled={cancelling}
          >
            Keep Booking
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirm}
            disabled={cancelling || loadingPreview}
            startIcon={cancelling ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {cancelling ? "Cancelling…" : "Confirm Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
