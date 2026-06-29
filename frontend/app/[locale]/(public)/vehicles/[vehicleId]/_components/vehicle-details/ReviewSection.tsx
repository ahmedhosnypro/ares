"use client";

import { useTranslations } from "next-intl";
import { Box, Paper, Rating, Stack, Typography } from "@mui/material";
import type { VehicleReviewViewModel } from "./types";

interface ReviewSectionProps {
  readonly reviews: readonly VehicleReviewViewModel[];
}

function formatReviewDate(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ReviewSection({ reviews }: ReviewSectionProps) {
  const t = useTranslations("publicPages.vehicles.detail");
  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {t("customerReviews")}
        </Typography>
        {reviews.length > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {reviews.length} {reviews.length === 1 ? t("review") : t("reviews")}
          </Typography>
        ) : null}
      </Stack>

      {reviews.length > 0 ? (
        <Stack spacing={1.5}>
          {reviews.map(review => (
            <Paper key={review.reviewId || `${review.userName}-${review.createdAt}`} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {review.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatReviewDate(review.createdAt)}
                  </Typography>
                </Stack>
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {review.comment || t("noWrittenFeedback")}
                </Typography>
                {review.supplierReply ? (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                          {t("responseFromSupplier")}
                        </Typography>
                        {review.repliedAt && (
                          <Typography variant="caption" color="text.secondary">
                            {formatReviewDate(review.repliedAt)}
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {review.supplierReply}
                      </Typography>
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            {t("noReviewsYet")}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
