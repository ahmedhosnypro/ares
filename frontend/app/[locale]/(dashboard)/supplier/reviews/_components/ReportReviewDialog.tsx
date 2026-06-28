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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import { useTranslations } from "next-intl";
import type { SupplierReviewListItem } from "@/api-clients/supplier-reviews/supplier-reviews";

const MAX_REASON_LENGTH = 1000;

const PRESET_REASON_KEYS = [
  "inappropriateLanguage",
  "spamOrAdvertising",
  "personalAttack",
  "untrueInformation",
  "disclosesPrivateInfo",
  "offTopic",
  "other",
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

function ReportReviewDialogInner({ open, review, submitting, onClose, onSubmit }: ReportReviewDialogInnerProps) {
  const t = useTranslations("dashboard.supplierReviews");
  const tc = useTranslations("common");
  const [category, setCategory] = useState<string>("");
  const [details, setDetails] = useState<string>(review.reportReason ?? "");
  const [touched, setTouched] = useState(false);

  const detailTrim = details.trim();
  const finalReason = (() => {
    if (!category) return detailTrim;
    if (!detailTrim) return category;
    return `${category} - ${detailTrim}`;
  })();

  const empty = finalReason.length === 0;
  const tooLong = finalReason.length > MAX_REASON_LENGTH;

  let error: string | null = null;
  if (touched) {
    if (empty) error = t("reportDialog.validation.required");
    else if (tooLong) error = t("reportDialog.validation.maxLength", { max: MAX_REASON_LENGTH });
  }

  const canSubmit = !submitting && !empty && !tooLong;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit(review.reviewId, finalReason);
  };

  const presetValues = PRESET_REASON_KEYS.map(key => ({
    key,
    label: t(`reportDialog.presetReasons.${key}`),
  }));

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 2, mx: { xs: 2, sm: "auto" } } } }}
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
          <span>{review.isReported ? t("reportDialog.updateTitle") : t("reportDialog.reportTitle")}</span>
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={submitting} aria-label="close" sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("reportDialog.description")}
        </Typography>

        {review.isReported && (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            {t("reportDialog.editAlert")}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label={t("reportDialog.reason")}
            value={category}
            onChange={e => {
              setCategory(e.target.value);
            }}
            disabled={submitting}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
          >
            <MenuItem value="">
              <em>{t("reportDialog.chooseReason")}</em>
            </MenuItem>
            {presetValues.map(pv => (
              <MenuItem key={pv.key} value={pv.label}>
                {pv.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            label={t("reportDialog.additionalDetails")}
            placeholder={t("reportDialog.detailsPlaceholder")}
            value={details}
            onChange={e => {
              setDetails(e.target.value);
            }}
            onBlur={() => {
              setTouched(true);
            }}
            disabled={submitting}
            error={Boolean(error)}
            helperText={
              error ??
              t("reportDialog.charactersCount", {
                current: finalReason.length.toString(),
                max: MAX_REASON_LENGTH.toString(),
              })
            }
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
                {t("reportDialog.willBeSubmitted")}
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
          {tc("cancel")}
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
          {submitting ? <CircularProgress size={20} color="inherit" /> : t("reportDialog.submitReport")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
