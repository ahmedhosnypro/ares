"use client";

/**
 * Report-review dialog used on the supplier reviews page.
 *
 * Suppliers cannot delete reviews; this modal lets them flag a review
 * as inappropriate so admins can act on it later. It hits
 * `POST /api/supplier/reviews/{reviewId}/report`. Per backend behavior
 * the request is idempotent - calling it again overwrites the reason
 * and timestamp.
 *
 * Validation mirrors the backend `SupplierReportReviewRequestValidator`
 * (1-1000 chars, required).
 */

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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import type { SupplierReviewListItem } from "@/api-clients/supplier-reviews/supplier-reviews";

const MAX_REASON_LENGTH = 1000;

const PRESET_REASONS = [
  "Inappropriate language",
  "Spam or advertising",
  "Personal attack or harassment",
  "Untrue or misleading information",
  "Discloses private information",
  "Off-topic - not about the rental",
  "Other (describe below)",
] as const;

export interface ReportReviewDialogProps {
  readonly open: boolean;
  readonly review: SupplierReviewListItem | null;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (reviewId: string, reason: string) => Promise<void>;
}

export default function ReportReviewDialog({ open, review, submitting, onClose, onSubmit }: ReportReviewDialogProps) {
  if (!review) return null;
  return (
    <ReportReviewDialogInner
      key={`${review.reviewId}:${open ? "open" : "closed"}`}
      open={open}
      review={review}
      submitting={submitting}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

interface ReportReviewDialogInnerProps {
  readonly open: boolean;
  readonly review: SupplierReviewListItem;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (reviewId: string, reason: string) => Promise<void>;
}

function composeReason(category: string, details: string): string {
  const detailTrim = details.trim();
  if (!category) return detailTrim;
  if (!detailTrim) return category;
  return `${category} - ${detailTrim}`;
}

function computeError(touched: boolean, empty: boolean, tooLong: boolean): string | null {
  if (!touched) return null;
  if (empty) return "Please choose a reason or describe the issue.";
  if (tooLong) return `Reason must not exceed ${MAX_REASON_LENGTH.toString()} characters.`;
  return null;
}

function ReportReviewDialogInner({ open, review, submitting, onClose, onSubmit }: ReportReviewDialogInnerProps) {
  const [category, setCategory] = useState<string>("");
  const [details, setDetails] = useState<string>(review.reportReason ?? "");
  const [touched, setTouched] = useState(false);

  const finalReason = composeReason(category, details);
  const empty = finalReason.length === 0;
  const tooLong = finalReason.length > MAX_REASON_LENGTH;
  const error = computeError(touched, empty, tooLong);
  const canSubmit = !submitting && !empty && !tooLong;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit(review.reviewId, finalReason);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3, mx: { xs: 2, sm: "auto" } } } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1.5,
          pb: 1,
          fontWeight: 700,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <ReportProblemRoundedIcon color="error" />
          <span>{review.isReported ? "Update report" : "Report this review"}</span>
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={submitting} aria-label="close" sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Flag this review so administrators can review it. Suppliers can&apos;t delete customer reviews - reporting
          forwards the case to the moderation queue.
        </Typography>

        {review.isReported && (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            You already reported this review. Submitting again will replace your previous reason.
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="Reason"
            value={category}
            onChange={e => {
              setCategory(e.target.value);
            }}
            disabled={submitting}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">
              <em>Choose a reason...</em>
            </MenuItem>
            {PRESET_REASONS.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            label="Additional details"
            placeholder="Add context that will help admins evaluate the report..."
            value={details}
            onChange={e => {
              setDetails(e.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
            disabled={submitting}
            error={Boolean(error)}
            helperText={error ?? `${finalReason.length.toString()} / ${MAX_REASON_LENGTH.toString()} characters`}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          />

          {finalReason && !error && (
            <Box
              sx={{
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                p: 1.5,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Will be submitted as:
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-line" }}>
                {finalReason}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none", flex: { xs: 1, sm: "none" } }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            void handleSubmit();
          }}
          variant="contained"
          color="error"
          disabled={!canSubmit}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", flex: { xs: 1, sm: "none" } }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : "Submit report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
