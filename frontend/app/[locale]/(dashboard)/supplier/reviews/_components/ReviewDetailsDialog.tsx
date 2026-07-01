"use client";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChatBubbleOutlinedRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import DirectionsCarFilledTwoToneIcon from "@mui/icons-material/DirectionsCarFilledTwoTone";
import PersonOutlinedRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDateTime } from "@/utils/dateTime";
import RatingStars from "./RatingStars";
import type { SupplierReviewListItem } from "@/api-clients/supplier-reviews/supplier-reviews";

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return formatUtcDateTime(iso, locale);
}

export interface ReviewDetailsDialogProps {
  readonly open: boolean;
  readonly review: SupplierReviewListItem | null;
  readonly onClose: () => void;
  readonly onReply: (review: SupplierReviewListItem) => void;
  readonly onReport: (review: SupplierReviewListItem) => void;
}

export default function ReviewDetailsDialog({ open, review, onClose, onReply, onReport }: ReviewDetailsDialogProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.supplierReviews");
  const locale = useLocale();
  if (!review) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <span>{t("detailsDialog.title")}</span>
        <IconButton size="small" onClick={onClose} aria-label="close" sx={{ borderRadius: 2 }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 1.5, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 2 }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
              <PersonOutlinedRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {review.customerName || t("detailsDialog.customerDefault")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("detailsDialog.reviewedOn")} {formatDate(review.createdAt, locale)}
              </Typography>
            </Box>
          </Stack>
          <RatingStars rating={review.rating} size="medium" showValue />
        </Stack>

        <Box
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            p: 1.5,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: "primary.main",
              width: 40,
              height: 40,
              borderRadius: 2,
            }}
          >
            <DirectionsCarFilledTwoToneIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {review.vehicleMake} {review.vehicleModel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {review.vehicleYear
                ? `${t("detailsDialog.year")} ${String(review.vehicleYear)}`
                : `${t("detailsDialog.year")} —`}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
          {t("detailsDialog.customerComment")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            mb: 2,
            whiteSpace: "pre-line",
            color: review.comment ? "text.primary" : "text.disabled",
            fontStyle: review.comment ? "normal" : "italic",
          }}
        >
          {review.comment?.trim() || t("detailsDialog.noComment")}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
            {t("detailsDialog.yourReply")}
          </Typography>
          {review.hasReply && (
            <Chip
              size="small"
              label={`${t("detailsDialog.replied")} ${formatDate(review.repliedAt, locale)}`}
              sx={{
                fontWeight: 600,
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: "success.main",
                borderRadius: 1.5,
                height: 22,
              }}
            />
          )}
        </Stack>
        {review.hasReply ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", mb: 2 }}>
            {review.supplierReply}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic", mb: 2 }}>
            {t("detailsDialog.notRepliedYet")}
          </Typography>
        )}

        {review.isReported && (
          <Box
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.4),
              bgcolor: alpha(theme.palette.error.main, 0.04),
              p: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <ReportProblemRoundedIcon fontSize="small" color="error" />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                {t("detailsDialog.reportedLabel")} {formatDate(review.reportedAt, locale)}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {review.reportReason || t("detailsDialog.noReasonRecorded")}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button
          onClick={() => {
            onReport(review);
          }}
          variant="outlined"
          color="error"
          startIcon={<ReportProblemRoundedIcon />}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none", flex: { xs: 1, sm: "none" } }}
        >
          {review.isReported ? t("detailsDialog.updateReport") : t("detailsDialog.report")}
        </Button>
        <Button
          onClick={() => {
            onReply(review);
          }}
          variant="contained"
          startIcon={<ChatBubbleOutlinedRoundedIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", flex: { xs: 1, sm: "none" } }}
        >
          {review.hasReply ? t("detailsDialog.editReply") : t("detailsDialog.reply")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
