"use client";

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChatBubbleOutlinedRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PersonOutlinedRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useTranslations } from "next-intl";
import RatingStars from "./RatingStars";
import type { SupplierReviewListItem } from "@/api-clients/supplier-reviews/supplier-reviews";

const MAX_REPLY_LENGTH = 2000;

export interface ReplyReviewDialogProps {
  readonly open: boolean;
  readonly review: SupplierReviewListItem | null;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (reviewId: string, reply: string) => Promise<void>;
}

function formatReviewDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function ReplyReviewDialog({ open, review, submitting, onClose, onSubmit }: ReplyReviewDialogProps) {
  if (!review) return null;
  return (
    <ReplyReviewDialogInner
      key={`${review.reviewId}:${open ? "open" : "closed"}`}
      open={open}
      review={review}
      submitting={submitting}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

interface ReplyReviewDialogInnerProps {
  readonly open: boolean;
  readonly review: SupplierReviewListItem;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (reviewId: string, reply: string) => Promise<void>;
}

function ReplyReviewDialogInner({ open, review, submitting, onClose, onSubmit }: ReplyReviewDialogInnerProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.supplierReviews");
  const tc = useTranslations("common");
  const [reply, setReply] = useState(review.supplierReply ?? "");
  const [touched, setTouched] = useState(false);

  const isEdit = review.hasReply;
  const trimmed = reply.trim();
  const tooLong = reply.length > MAX_REPLY_LENGTH;
  const empty = trimmed.length === 0;

  let error: string | null = null;
  if (touched) {
    if (empty) error = t("replyDialog.validation.required");
    else if (tooLong) error = t("replyDialog.validation.maxLength", { max: MAX_REPLY_LENGTH });
  }

  const canSubmit = !submitting && !empty && !tooLong;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    await onSubmit(review.reviewId, trimmed);
  };

  let submitLabel: React.ReactNode = t("replyDialog.submitReply");
  if (submitting) {
    submitLabel = <CircularProgress size={20} color="inherit" />;
  } else if (isEdit) {
    submitLabel = t("replyDialog.saveChanges");
  }

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
          <ChatBubbleOutlinedRoundedIcon color="primary" />
          <span>{isEdit ? t("replyDialog.editTitle") : t("replyDialog.replyTitle")}</span>
        </Stack>
        <IconButton size="small" onClick={onClose} disabled={submitting} aria-label="close" sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            mb: 2.5,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ gap: 1.5, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 1 }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  width: 36,
                  height: 36,
                }}
              >
                <PersonOutlinedRoundedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {review.customerName || t("replyDialog.customerDefault")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatReviewDate(review.createdAt)}
                </Typography>
              </Box>
            </Stack>
            <RatingStars rating={review.rating} size="small" showValue />
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
            {t("replyDialog.vehicleLabel")}: {review.vehicleMake} {review.vehicleModel}
            {review.vehicleYear ? ` · ${String(review.vehicleYear)}` : ""}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-line",
              color: review.comment ? "text.primary" : "text.disabled",
              fontStyle: review.comment ? "normal" : "italic",
            }}
          >
            {review.comment?.trim() || t("replyDialog.noComment")}
          </Typography>
        </Box>

        {isEdit && (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            {t("replyDialog.editAlert")}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          label={t("replyDialog.yourReply")}
          placeholder={t("replyDialog.replyPlaceholder")}
          value={reply}
          onChange={e => {
            setReply(e.target.value);
          }}
          onBlur={() => {
            setTouched(true);
          }}
          disabled={submitting}
          error={Boolean(error)}
          helperText={error ?? t("replyDialog.charactersCount", { current: reply.length.toString(), max: MAX_REPLY_LENGTH.toString() })}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" } }}
        />
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
          disabled={!canSubmit}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", flex: { xs: 1, sm: "none" } }}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
