"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { RateReview as RateReviewIcon } from "@mui/icons-material";
import { ApiError, toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface BookingReviewSectionProps {
  readonly bookingId: string;
  readonly vehicleId?: string;
  readonly status?: string;
  readonly accessToken: string;
}

interface BookingReviewDto {
  readonly reviewId: string;
  readonly bookingId: string;
  readonly vehicleId: string;
  readonly userId: string;
  readonly rating: number;
  readonly comment?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly editDeadline: string;
  readonly canEdit: boolean;
}

const COMMENT_MAX = 1000;

function isCompletedStatus(status?: string): boolean {
  return status?.toLowerCase() === "completed";
}

function formatDeadline(value?: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isReviewPayload(value: unknown): value is BookingReviewDto {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.reviewId === "string" && typeof record.bookingId === "string" && typeof record.rating === "number"
  );
}

interface ReviewFormProps {
  readonly draftRating: number | null;
  readonly setDraftRating: (val: number | null) => void;
  readonly draftComment: string;
  readonly setDraftComment: (val: string) => void;
  readonly onSubmit: () => Promise<void>;
  readonly onCancel: () => void;
  readonly submitting: boolean;
  readonly isUpdate: boolean;
}

function ReviewForm({
  draftRating,
  setDraftRating,
  draftComment,
  setDraftComment,
  onSubmit,
  onCancel,
  submitting,
  isUpdate,
}: ReviewFormProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Rating
        </Typography>
        <Rating
          value={draftRating}
          onChange={(_, value) => {
            setDraftRating(value);
          }}
          size="large"
        />
      </Box>
      <TextField
        label="Comment (optional)"
        multiline
        minRows={3}
        fullWidth
        value={draftComment}
        onChange={(e) => {
          setDraftComment(e.target.value);
        }}
        slotProps={{ htmlInput: { maxLength: COMMENT_MAX } }}
        helperText={`${String(draftComment.length)}/${String(COMMENT_MAX)}`}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="contained"
          onClick={() => {
            void onSubmit();
          }}
          disabled={submitting}
        >
          {submitting ? (isUpdate ? "Saving…" : "Submitting…") : isUpdate ? "Save Changes" : "Submit Review"}
        </Button>
        <Button variant="outlined" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}

interface ReviewViewStateProps {
  readonly review: BookingReviewDto;
  readonly onEdit: () => void;
}

function ReviewViewState({ review, onEdit }: ReviewViewStateProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Rating value={review.rating} readOnly />
        <Typography variant="caption" color="text.secondary">
          {review.canEdit
            ? `Editable until ${formatDeadline(review.editDeadline)}`
            : "This review can no longer be edited (24h window passed)."}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.primary">
        {review.comment && review.comment.trim() !== "" ? review.comment : "No written feedback provided."}
      </Typography>
      {review.canEdit ? (
        <Box>
          <Button variant="outlined" onClick={onEdit}>
            Edit Review
          </Button>
        </Box>
      ) : null}
    </Stack>
  );
}

interface EmptyReviewStateProps {
  readonly onStartCreate: () => void;
  readonly vehicleId?: string;
}

function EmptyReviewState({ onStartCreate, vehicleId }: EmptyReviewStateProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        How was your experience? Leave a quick rating and an optional comment.
      </Typography>
      <Box>
        <Button variant="contained" onClick={onStartCreate} disabled={!vehicleId}>
          Write a Review
        </Button>
      </Box>
    </Stack>
  );
}

function getSubmissionErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) {
      return "Please double-check your review and try again.";
    }
    if (err.status === 409) {
      return "A review for this booking already exists.";
    }
  }
  return "Unable to save your review. Please try again.";
}

export default function BookingReviewSection({
  bookingId,
  vehicleId,
  status,
  accessToken,
}: Readonly<BookingReviewSectionProps>) {
  const [review, setReview] = useState<BookingReviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftComment, setDraftComment] = useState("");

  const completed = useMemo(() => isCompletedStatus(status), [status]);

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(toApiUrl(`/api/reviews/booking/${bookingId}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (res.status === 204 || res.status === 404) {
        setReview(null);
        return;
      }

      if (!res.ok) {
        throw new ApiError(res.status, res.statusText, await res.text());
      }

      const data: unknown = await res.json();
      if (!isReviewPayload(data)) {
        throw new Error("Unexpected review response shape");
      }

      setReview(data);
      setDraftRating(data.rating);
      setDraftComment(data.comment ?? "");
    } catch (err) {
      logger.error("Load booking review failed", err);
      setError("Unable to load your review right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, accessToken]);

  useEffect(() => {
    if (!completed) {
      setLoading(false);
      return;
    }
    void loadReview();
  }, [completed, loadReview]);

  const handleStartCreate = useCallback(() => {
    setDraftRating(null);
    setDraftComment("");
    setEditing(true);
    setFeedback(null);
    setError(null);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (!review) return;
    setDraftRating(review.rating);
    setDraftComment(review.comment ?? "");
    setEditing(true);
    setFeedback(null);
    setError(null);
  }, [review]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setError(null);
    if (review) {
      setDraftRating(review.rating);
      setDraftComment(review.comment ?? "");
    } else {
      setDraftRating(null);
      setDraftComment("");
    }
  }, [review]);

  const handleSubmit = useCallback(async () => {
    if (draftRating == null || draftRating < 1 || draftRating > 5) {
      setError("Please pick a rating between 1 and 5 stars.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const isUpdate = review !== null;
      const url = isUpdate ? toApiUrl(`/api/reviews/${review.reviewId}`) : toApiUrl(`/api/reviews/create`);
      const method = isUpdate ? "PUT" : "POST";
      const trimmedComment = draftComment.trim() === "" ? null : draftComment.trim();

      const body = isUpdate
        ? { Rating: draftRating, Comment: trimmedComment }
        : {
            VehicleId: vehicleId,
            BookingId: bookingId,
            Rating: draftRating,
            Comment: trimmedComment,
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new ApiError(res.status, res.statusText, await res.text());
      }

      if (isUpdate) {
        const data: unknown = await res.json();
        if (isReviewPayload(data)) {
          setReview(data);
        }
        setFeedback("Your review has been updated.");
      } else {
        await loadReview();
        setFeedback("Thanks! Your review has been submitted.");
      }
      setEditing(false);
    } catch (err) {
      logger.error("Submit booking review failed", err);
      setError(getSubmissionErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [draftRating, draftComment, review, vehicleId, bookingId, accessToken, loadReview]);

  if (!completed) {
    return null;
  }

  return (
    <Paper
      sx={{
        mt: 3,
        border: "1px solid",
        borderColor: "border.main",
        bgcolor: "background.paper",
        boxShadow: "shadow.card",
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Box sx={{ color: "primary.main", display: "flex" }}>
            <RateReviewIcon />
          </Box>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800 }}>
            Your Review
          </Typography>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {feedback ? <Alert severity="success">{feedback}</Alert> : null}

            {editing ? (
              <ReviewForm
                draftRating={draftRating}
                setDraftRating={setDraftRating}
                draftComment={draftComment}
                setDraftComment={setDraftComment}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitting={submitting}
                isUpdate={!!review}
              />
            ) : review ? (
              <ReviewViewState review={review} onEdit={handleStartEdit} />
            ) : (
              <EmptyReviewState onStartCreate={handleStartCreate} vehicleId={vehicleId} />
            )}
          </Stack>
        )}
      </CardContent>
    </Paper>
  );
}
