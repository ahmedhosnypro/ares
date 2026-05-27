/* eslint-disable sonarjs/cognitive-complexity, sonarjs/pseudo-random */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import {
  getInspectionDetails,
  submitInspection,
  uploadInspectionImages,
  type InspectionDetails,
  type InspectionImage,
} from "@/api-clients/inspections/inspections";
import { ApiError } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import InspectionStatusBadge from "../../../_components/InspectionStatusBadge";

interface Props {
  readonly inspectionId: string;
}

interface PendingImage {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
}

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;

export default function InspectionDetailsClient({ inspectionId }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState<InspectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Local draft state
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false,
    severity: "success",
    message: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInspectionDetails(inspectionId);
      setDetails(data);
      setNotes(data.notes ?? "");
    } catch (err) {
      logger.error("Failed to load inspection", err);
      if (err instanceof ApiError && err.status === 403) {
        setLoadError("You do not have access to this inspection.");
      } else if (err instanceof ApiError && err.status === 404) {
        setLoadError("Inspection not found.");
      } else {
        setLoadError("Failed to load inspection details.");
      }
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach(p => {
        URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLocked = details?.isSubmitted ?? false;
  const totalImageCount = (details?.images.length ?? 0) + pendingImages.length;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - totalImageCount;
    if (remainingSlots <= 0) {
      setToast({ open: true, severity: "error", message: `Maximum ${String(MAX_IMAGES)} images allowed` });
      event.target.value = "";
      return;
    }

    const accepted = files.slice(0, remainingSlots).map(file => ({
      id: `${file.name}-${String(Date.now())}-${String(Math.random())}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages(prev => [...prev, ...accepted]);
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
    event.target.value = "";
  };

  const removePending = (id: string) => {
    setPendingImages(prev => {
      const target = prev.find(p => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (totalImageCount < MIN_IMAGES) {
      next.images = `Upload at least ${String(MIN_IMAGES)} image to submit.`;
    }
    if (!notes.trim() || notes.trim().length < 3) {
      next.notes = "Inspection notes are required (minimum 3 characters).";
    }
    if (!decision) {
      next.decision = "Please select Approve or Reject before submitting.";
    }
    setValidationErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !details) return;
    setSubmitting(true);
    try {
      // 1. Upload any pending images
      if (pendingImages.length > 0) {
        await uploadInspectionImages(
          details.inspectionId,
          pendingImages.map(p => p.file)
        );
        pendingImages.forEach(p => {
          URL.revokeObjectURL(p.previewUrl);
        });
        setPendingImages([]);
      }
      // 2. Submit
      const result = await submitInspection(details.inspectionId, {
        approve: decision === "approve",
        notes: notes.trim(),
      });
      setDetails(result);
      setToast({
        open: true,
        severity: "success",
        message: `Inspection ${result.status.toLowerCase()} successfully`,
      });
      setConfirmOpen(false);
      // Refresh from server to make sure everything is in sync
      await fetchData();
    } catch (err) {
      logger.error("Submit inspection failed", err);
      let message = "Failed to submit inspection.";
      if (err instanceof ApiError) {
        message = err.body || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setToast({ open: true, severity: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const allImages = useMemo(() => {
    const existing: { id: string; src: string | undefined; uploaded: true; raw?: InspectionImage }[] = (
      details?.images ?? []
    ).map(img => ({
      id: img.id,
      src: toImageUrl(img.imageUrl),
      uploaded: true,
      raw: img,
    }));
    const pending: { id: string; src: string; uploaded: false }[] = pendingImages.map(p => ({
      id: p.id,
      src: p.previewUrl,
      uploaded: false,
    }));
    return [...existing, ...pending];
  }, [details?.images, pendingImages]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !details) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Alert severity="error">{loadError || "Inspection not found"}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
          onClick={() => {
            router.push("/inspector/inspections");
          }}
        >
          Back to assignments
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          router.push("/inspector/inspections");
        }}
        sx={{ mb: 2 }}
      >
        Back to assignments
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Inspection · {details.bookingNumber || details.bookingId.split("-")[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created {new Date(details.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <InspectionStatusBadge status={details.status} size="medium" />
          {isLocked && (
            <Chip
              icon={<LockIcon />}
              label="Locked"
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.grey[500], 0.15),
                color: "text.secondary",
                fontWeight: 700,
              }}
            />
          )}
        </Stack>
      </Stack>

      {isLocked && (
        <Alert severity={details.status === "Approved" ? "success" : "error"} sx={{ mb: 3 }}>
          This inspection was submitted on {details.submittedAt ? new Date(details.submittedAt).toLocaleString() : "—"}{" "}
          and is now locked.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* A. Booking & Vehicle Info */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Booking Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <InfoRow label="Booking Number" value={details.bookingNumber || "—"} />
              <InfoRow label="Vehicle" value={details.vehicleDisplayName} />
              <InfoRow label="Assigned To" value={details.inspectorFullName} />
              <InfoRow label="Inspection Date" value={new Date(details.inspectionDate).toLocaleString()} />
              {details.submittedAt && (
                <InfoRow label="Submitted" value={new Date(details.submittedAt).toLocaleString()} />
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* C. Inspection Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Inspection Report
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Image upload */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Photos ({String(totalImageCount)}/{String(MAX_IMAGES)})
                </Typography>
                {!isLocked && (
                  <Button
                    size="small"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalImageCount >= MAX_IMAGES || submitting}
                  >
                    Add photos
                  </Button>
                )}
              </Stack>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {allImages.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed",
                    borderColor: validationErrors.images ? "error.main" : "divider",
                    borderRadius: 2,
                    p: 4,
                    textAlign: "center",
                    cursor: isLocked ? "default" : "pointer",
                  }}
                  onClick={() => {
                    if (!isLocked) fileInputRef.current?.click();
                  }}
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {isLocked ? "No images uploaded" : "Click to upload inspection photos"}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {allImages.map(img => (
                    <Grid key={img.id} size={{ xs: 6, sm: 4 }}>
                      <Box
                        sx={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.default",
                        }}
                      >
                        {img.src && (
                          // Using regular img to support blob: previews and avoid Next.js image config
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.src}
                            alt="Inspection"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        {!isLocked && !img.uploaded && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              removePending(img.id);
                            }}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              bgcolor: alpha(theme.palette.common.black, 0.55),
                              color: "common.white",
                              "&:hover": { bgcolor: alpha(theme.palette.common.black, 0.75) },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                        {img.uploaded && (
                          <Chip
                            size="small"
                            label="Saved"
                            sx={{
                              position: "absolute",
                              bottom: 4,
                              left: 4,
                              bgcolor: alpha(theme.palette.success.main, 0.85),
                              color: "common.white",
                              fontWeight: 700,
                              fontSize: 10,
                              height: 18,
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              {validationErrors.images && (
                <Typography variant="caption" color="error.main" sx={{ mt: 1, display: "block" }}>
                  {validationErrors.images}
                </Typography>
              )}
              {!isLocked && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Upload between {String(MIN_IMAGES)} and {String(MAX_IMAGES)} photos. JPG/PNG/WebP supported.
                </Typography>
              )}
            </Box>

            {/* Notes */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Notes / Damage Report
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={5}
                value={notes}
                onChange={e => {
                  setNotes(e.target.value);
                  if (validationErrors.notes) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.notes;
                      return next;
                    });
                  }
                }}
                placeholder="Describe the vehicle's condition, any visible damage, scratches, missing items..."
                disabled={isLocked || submitting}
                error={!!validationErrors.notes}
                helperText={validationErrors.notes}
              />
            </Box>

            {/* Decision */}
            {!isLocked && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Decision
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    fullWidth
                    variant={decision === "approve" ? "contained" : "outlined"}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => {
                      setDecision("approve");
                      if (validationErrors.decision) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.decision;
                          return next;
                        });
                      }
                    }}
                    disabled={submitting}
                  >
                    Approve
                  </Button>
                  <Button
                    fullWidth
                    variant={decision === "reject" ? "contained" : "outlined"}
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setDecision("reject");
                      if (validationErrors.decision) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.decision;
                          return next;
                        });
                      }
                    }}
                    disabled={submitting}
                  >
                    Reject
                  </Button>
                </Stack>
                {validationErrors.decision && (
                  <Typography variant="caption" color="error.main" sx={{ mt: 1, display: "block" }}>
                    {validationErrors.decision}
                  </Typography>
                )}
              </Box>
            )}

            {/* Submit */}
            {!isLocked ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={submitting}
                onClick={() => {
                  if (!validate()) return;
                  setConfirmOpen(true);
                }}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
              >
                {submitting ? "Submitting..." : "Submit Inspection"}
              </Button>
            ) : (
              <Alert severity="info" icon={<LockIcon />}>
                This inspection is locked. No further changes can be made.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!submitting) setConfirmOpen(false);
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You are about to {decision === "approve" ? "approve" : "reject"} this inspection. Once submitted, the
            inspection becomes locked and cannot be modified.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setConfirmOpen(false);
            }}
            disabled={submitting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            variant="contained"
            color={decision === "approve" ? "success" : "error"}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? "Submitting..." : decision === "approve" ? "Yes, approve" : "Yes, reject"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => {
          setToast(t => ({ ...t, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}
