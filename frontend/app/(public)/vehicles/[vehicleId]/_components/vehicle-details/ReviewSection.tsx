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
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>
          Customer reviews
        </Typography>
        {reviews.length > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </Typography>
        ) : null}
      </Stack>

      {reviews.length > 0 ? (
        <Stack spacing={1.5}>
          {reviews.map(review => (
            <Paper key={review.reviewId || `${review.userName}-${review.createdAt}`} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={700}>
                    {review.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatReviewDate(review.createdAt)}
                  </Typography>
                </Stack>
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {review.comment || "No written feedback provided."}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            No reviews yet for this vehicle.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
