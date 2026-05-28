"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
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
  useTheme,
  alpha,
  type Theme,
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

export default function InspectionDetailsClient({ inspectionId }: Props): JSX.Element {
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
  }, [pendingImages]);

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
      id: `${file.name}-${String(Date.now())}-${self.crypto.randomUUID()}`,
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
    const errors: Record<string, string> = {};
    if (!decision) errors.decision = "Please select a decision (Approve or Reject)";
    if (!notes.trim()) errors.notes = "Please provide inspection notes";
    if (totalImageCount < MIN_IMAGES) errors.images = `At least ${String(MIN_IMAGES)} photo is required`;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmSubmit = () => {
    if (validate()) setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);

    try {
      // 1. Upload images first if any pending
      if (pendingImages.length > 0) {
        await uploadInspectionImages(
          inspectionId,
          pendingImages.map(p => p.file)
        );
      }

      // 2. Submit the report
      await submitInspection(inspectionId, {
        notes,
        approve: decision === "approve",
      });

      setToast({ open: true, severity: "success", message: "Inspection submitted successfully" });
      void fetchData();
    } catch (err) {
      logger.error("Failed to submit inspection", err);
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setToast({ open: true, severity: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const allImages = useMemo(() => {
    const existing = (details?.images ?? []).map(img => ({
      id: img.id,
      src: toImageUrl(img.imageUrl),
      isPending: false,
    }));
    const pending = pendingImages.map(p => ({
      id: p.id,
      src: p.previewUrl,
      isPending: true,
    }));
    return [...existing, ...pending];
  }, [details, pendingImages]);

  if (loading && !details) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                router.back();
              }}
            >
              Go Back
            </Button>
          }
        >
          {loadError}
        </Alert>
      </Box>
    );
  }

  if (!details) return <Box>Not found</Box>;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 4 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <IconButton
            onClick={() => {
              router.back();
            }}
            sx={{ bgcolor: "background.paper", boxShadow: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Inspection Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and submit inspection report for booking #{details.bookingNumber}
            </Typography>
          </Box>
        </Stack>
        <InspectionStatusBadge status={details.status} />
      </Stack>

      <Grid container spacing={3}>
        {/* A. Booking & Vehicle Info */}
        <Grid size={{ xs: 12, md: 5 }}>
          <BookingInfoSection details={details} />
        </Grid>

        {/* C. Inspection Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <InspectionReportForm
            isLocked={isLocked}
            totalImageCount={totalImageCount}
            submitting={submitting}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            allImages={allImages}
            removePending={removePending}
            validationErrors={validationErrors}
            decision={decision}
            setDecision={setDecision}
            notes={notes}
            setNotes={setNotes}
            handleConfirmSubmit={handleConfirmSubmit}
            theme={theme}
          />
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Inspection Report?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You are about to mark this vehicle as <strong>{decision?.toUpperCase()}</strong>. This action is permanent
            and will notify the relevant parties.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => {
              setConfirmOpen(false);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => {
          setToast(prev => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setToast(prev => ({ ...prev, open: false }));
          }}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

function BookingInfoSection({ details }: { readonly details: InspectionDetails }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Booking Information
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={2}>
        <InfoRow label="Booking Number" value={details.bookingNumber || "—"} />
        <InfoRow label="Vehicle" value={details.vehicleDisplayName} />
        <InfoRow label="Assigned To" value={details.inspectorFullName} />
        <InfoRow label="Inspection Date" value={new Date(details.inspectionDate).toLocaleString()} />
        {details.submittedAt && <InfoRow label="Submitted" value={new Date(details.submittedAt).toLocaleString()} />}
      </Stack>
    </Paper>
  );
}

interface InspectionReportFormProps {
  readonly isLocked: boolean;
  readonly totalImageCount: number;
  readonly submitting: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly allImages: readonly { id: string; src: string | undefined; isPending: boolean }[];
  readonly removePending: (id: string) => void;
  readonly validationErrors: Record<string, string>;
  readonly decision: "approve" | "reject" | null;
  readonly setDecision: (d: "approve" | "reject") => void;
  readonly notes: string;
  readonly setNotes: (n: string) => void;
  readonly handleConfirmSubmit: () => void;
  readonly theme: Theme;
}

function InspectionReportForm({
  isLocked,
  totalImageCount,
  submitting,
  fileInputRef,
  handleFileSelect,
  allImages,
  removePending,
  validationErrors,
  decision,
  setDecision,
  notes,
  setNotes,
  handleConfirmSubmit,
  theme,
}: InspectionReportFormProps) {
  return (
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
              onClick={() => {
                fileInputRef.current?.click();
              }}
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
                    <Box
                      component="img"
                      src={img.src}
                      alt="Inspection"
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {img.isPending && !isLocked && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        removePending(img.id);
                      }}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: alpha(theme.palette.error.main, 0.8),
                        color: "white",
                        "&:hover": { bgcolor: theme.palette.error.main },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        {validationErrors.images && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            {validationErrors.images}
          </Typography>
        )}
      </Box>

      {/* Decision */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Final Decision
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Button
              fullWidth
              variant={decision === "approve" ? "contained" : "outlined"}
              color="success"
              onClick={() => {
                if (!isLocked) setDecision("approve");
              }}
              disabled={isLocked || submitting}
              startIcon={<CheckCircleIcon />}
              sx={{ py: 1.2, borderRadius: 2, fontWeight: 700 }}
            >
              Approve
            </Button>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Button
              fullWidth
              variant={decision === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => {
                if (!isLocked) setDecision("reject");
              }}
              disabled={isLocked || submitting}
              startIcon={<CancelIcon />}
              sx={{ py: 1.2, borderRadius: 2, fontWeight: 700 }}
            >
              Reject
            </Button>
          </Grid>
        </Grid>
        {validationErrors.decision && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            {validationErrors.decision}
          </Typography>
        )}
      </Box>

      {/* Notes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Inspection Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Detailed observations about the vehicle's condition..."
          value={notes}
          onChange={e => {
            setNotes(e.target.value);
          }}
          disabled={isLocked || submitting}
          error={!!validationErrors.notes}
          helperText={validationErrors.notes}
          slotProps={{
            input: { sx: { borderRadius: 2, bgcolor: "background.default" } },
          }}
        />
      </Box>

      {/* Submit button */}
      {!isLocked ? (
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handleConfirmSubmit}
          disabled={submitting}
          sx={{ py: 1.5, borderRadius: 2, fontWeight: 800, fontSize: "1rem" }}
        >
          {submitting ? <CircularProgress size={26} color="inherit" /> : "Submit Inspection"}
        </Button>
      ) : (
        <Alert icon={<LockIcon />} severity="info" sx={{ borderRadius: 2 }}>
          This inspection report has been submitted and is now locked for editing.
        </Alert>
      )}
    </Paper>
  );
}
