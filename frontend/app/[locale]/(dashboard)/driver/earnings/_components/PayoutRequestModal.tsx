"use client";

import { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { requestDriverPayout } from "@/api-clients/driver-earnings/driver-earnings";
import { logger } from "@/utils/logger";

interface PayoutRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  accessToken: string;
  labels: {
    requestPayout: string;
    availablePayoutBalance: string;
    minimumPayout: string;
    amountToWithdraw: string;
    cancel: string;
    confirm: string;
    payoutRequested: string;
    amountExceedsBalance: string;
    amountBelowMinimum: string;
    payoutInfoNotVerified: string;
    payoutInfoMissing: string;
  };
}

const MINIMUM_PAYOUT = 10;

export default function PayoutRequestModal({
  open,
  onClose,
  onSuccess,
  availableBalance,
  accessToken,
  labels,
}: PayoutRequestModalProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setAmount("");
    setSubmitting(false);
    setSuccess(false);
    setValidationError(null);
    setApiError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setValidationError(labels.amountBelowMinimum);
      return;
    }
    if (numAmount < MINIMUM_PAYOUT) {
      setValidationError(labels.amountBelowMinimum);
      return;
    }
    if (numAmount > availableBalance) {
      setValidationError(labels.amountExceedsBalance);
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    setApiError(null);

    try {
      await requestDriverPayout(accessToken, numAmount);
      setSuccess(true);
      onSuccess();
    } catch (err) {
      logger.error("Failed to request driver payout", err);
      setApiError("Failed to request payout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [amount, availableBalance, accessToken, labels, onSuccess]);

  if (success) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{labels.requestPayout}</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mt: 1 }}>
            {labels.payoutRequested}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{labels.cancel}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{labels.requestPayout}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
            {labels.availablePayoutBalance.replace("{balance}", `$${availableBalance.toFixed(2)}`)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {labels.minimumPayout.replace("{amount}", `$${MINIMUM_PAYOUT.toFixed(2)}`)}
          </Typography>
        </Box>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
            {apiError}
          </Alert>
        )}

        <TextField
          label={labels.amountToWithdraw}
          type="number"
          value={amount}
          onChange={e => {
            setAmount(e.target.value);
            setValidationError(null);
          }}
          fullWidth
          size="small"
          error={Boolean(validationError)}
          helperText={validationError}
          inputProps={{ min: MINIMUM_PAYOUT, max: availableBalance, step: "0.01" }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          {labels.cancel}
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submitting || !amount}
        >
          {labels.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
