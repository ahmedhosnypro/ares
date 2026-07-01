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
  Slider,
  type Theme,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDateTime } from "@/utils/dateTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import SpeedIcon from "@mui/icons-material/Speed";
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
  const t = useTranslations("dashboardInspector.inspectionDetail");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState<InspectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [generalCondition, setGeneralCondition] = useState("");
  const [odometerReading, setOdometerReading] = useState<number | "">("");
  const [fuelLevel, setFuelLevel] = useState<number>(100);
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
      setGeneralCondition(data.generalCondition ?? "");
      setOdometerReading(data.odometerReading);
      setFuelLevel(data.fuelLevel);
      if (data.isSubmitted) {
        setDecision(data.status === "Approved" ? "approve" : data.status === "Rejected" ? "reject" : null);
      }
    } catch (err) {
      logger.error("Failed to load inspection", err);
      if (err instanceof ApiError && err.status === 403) {
        setLoadError(t("errors.accessDenied"));
      } else if (err instanceof ApiError && err.status === 404) {
        setLoadError(t("errors.notFound"));
      } else {
        setLoadError(t("errors.failedToLoad"));
      }
    } finally {
      setLoading(false);
    }
  }, [inspectionId, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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
      setToast({ open: true, severity: "error", message: t("errors.maxImages", { max: MAX_IMAGES }) });
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
    if (!decision) errors.decision = t("errors.selectDecision");
    if (!notes.trim()) errors.notes = t("errors.provideNotes");
    if (odometerReading === "" || odometerReading < 0) errors.odometerReading = t("errors.enterOdometer");
    if (totalImageCount < MIN_IMAGES) errors.images = t("errors.photoRequired", { min: MIN_IMAGES });

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
      if (pendingImages.length > 0) {
        await uploadInspectionImages(
          inspectionId,
          pendingImages.map(p => p.file)
        );
      }

      await submitInspection(inspectionId, {
        notes,
        generalCondition: generalCondition.trim() ? generalCondition : undefined,
        odometerReading: typeof odometerReading === "number" ? odometerReading : undefined,
        fuelLevel,
        approve: decision === "approve",
      });

      setToast({ open: true, severity: "success", message: t("success.submitted") });
      void fetchData();
    } catch (err) {
      logger.error("Failed to submit inspection", err);
      const msg = err instanceof Error ? err.message : t("errors.submitFailed");
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
              {t("actions.goBack")}
            </Button>
          }
        >
          {loadError}
        </Alert>
      </Box>
    );
  }

  if (!details) return <Box>{t("labels.notFound")}</Box>;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", mb: 4, gap: 2 }}
      >
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
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("labels.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("labels.subtitle", { bookingNumber: details.bookingNumber ?? "" })}
            </Typography>
          </Box>
        </Stack>
        <InspectionStatusBadge status={details.status} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <BookingInfoSection details={details} />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
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
            generalCondition={generalCondition}
            setGeneralCondition={setGeneralCondition}
            odometerReading={odometerReading}
            setOdometerReading={setOdometerReading}
            fuelLevel={fuelLevel}
            setFuelLevel={setFuelLevel}
            handleConfirmSubmit={handleConfirmSubmit}
            theme={theme}
          />
        </Grid>
      </Grid>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
        }}
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{t("labels.dialogTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            {t.rich("labels.dialogText", {
              decision: decision === "approve" ? t("actions.approveVehicle") : t("actions.rejectVehicle"),
              bold: chunks => <strong>{chunks}</strong>,
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => {
              setConfirmOpen(false);
            }}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {t("actions.confirmSubmit")}
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
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function BookingInfoSection({ details }: { readonly details: InspectionDetails }) {
  const t = useTranslations("dashboardInspector.inspectionDetail");
  const locale = useLocale();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        {t("labels.detailsTitle")}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Stack spacing={3}>
        <InfoRow label={t("labels.bookingNumber")} value={details.bookingNumber || "—"} />
        <InfoRow label={t("labels.vehicle")} value={details.vehicleDisplayName} />
        <InfoRow label={t("labels.assignedTo")} value={details.inspectorFullName} />
        <InfoRow label={t("labels.scheduledDate")} value={formatUtcDateTime(details.inspectionDate, locale)} />
        {details.submittedAt && (
          <InfoRow label={t("labels.submittedAt")} value={formatUtcDateTime(details.submittedAt, locale)} />
        )}
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
  readonly generalCondition: string;
  readonly setGeneralCondition: (n: string) => void;
  readonly odometerReading: number | "";
  readonly setOdometerReading: (n: number | "") => void;
  readonly fuelLevel: number;
  readonly setFuelLevel: (n: number) => void;
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
  generalCondition,
  setGeneralCondition,
  odometerReading,
  setOdometerReading,
  fuelLevel,
  setFuelLevel,
  handleConfirmSubmit,
  theme,
}: InspectionReportFormProps) {
  const t = useTranslations("dashboardInspector.inspectionDetail");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {isLocked && (
        <Alert icon={<LockIcon />} severity="info" sx={{ borderRadius: 2, mb: 4 }}>
          {t("labels.lockedAlert")}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
          {t("labels.vehicleMetrics")}
        </Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t("labels.odometerReading")}
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder={t("labels.odometerPlaceholder")}
              value={odometerReading}
              onChange={e => {
                const val = e.target.value;
                setOdometerReading(val === "" ? "" : Number(val));
              }}
              disabled={isLocked || submitting}
              error={!!validationErrors.odometerReading}
              helperText={validationErrors.odometerReading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SpeedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">{t("labels.odometerUnit")}</InputAdornment>,
                  sx: { borderRadius: 2 },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t("labels.fuelLevel", { level: fuelLevel })}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: 56,
                px: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: isLocked ? "action.disabledBackground" : "transparent",
              }}
            >
              <LocalGasStationIcon color={isLocked ? "disabled" : "primary"} sx={{ mr: 2 }} />
              <Slider
                value={fuelLevel}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: t("labels.fuelMarksE") },
                  { value: 25 },
                  { value: 50, label: t("labels.fuelMarksHalf") },
                  { value: 75 },
                  { value: 100, label: t("labels.fuelMarksF") },
                ]}
                onChange={(_, newVal) => {
                  if (typeof newVal === "number") setFuelLevel(newVal);
                }}
                disabled={isLocked || submitting}
                sx={{ mx: 2 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("labels.visualEvidence", { count: totalImageCount, max: MAX_IMAGES })}
          </Typography>
          {!isLocked && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={totalImageCount >= MAX_IMAGES || submitting}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {t("actions.uploadPhotos")}
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
              border: "2px dashed",
              borderColor: validationErrors.images ? "error.main" : "divider",
              borderRadius: 3,
              p: 6,
              textAlign: "center",
              cursor: isLocked ? "default" : "pointer",
              bgcolor: alpha(theme.palette.background.default, 0.5),
              transition: "all 0.2s",
              "&:hover": { bgcolor: isLocked ? "inherit" : "action.hover" },
            }}
            onClick={() => {
              if (!isLocked) fileInputRef.current?.click();
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isLocked ? t("labels.noPhotos") : t("labels.uploadTitle")}
            </Typography>
            {!isLocked && (
              <Typography variant="body2" color="text.secondary">
                {t("labels.uploadSubtitle", { min: MIN_IMAGES, max: MAX_IMAGES })}
              </Typography>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {allImages.map(img => (
              <Grid key={img.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                    boxShadow: theme.shadows[1],
                  }}
                >
                  {img.src && (
                    <Box
                      component="img"
                      src={img.src}
                      alt={t("labels.imageAltText")}
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
                        top: 8,
                        right: 8,
                        bgcolor: alpha(theme.palette.error.main, 0.9),
                        color: "common.white",
                        backdropFilter: "blur(4px)",
                        "&:hover": { bgcolor: theme.palette.error.main, transform: "scale(1.1)" },
                        transition: "all 0.2s",
                      }}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        {validationErrors.images && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block", fontWeight: 600 }}>
            {validationErrors.images}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
          {t("labels.conditionTitle")}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {t("labels.damageReport")}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder={t("labels.damagePlaceholder")}
          value={generalCondition}
          onChange={e => {
            setGeneralCondition(e.target.value);
          }}
          disabled={isLocked || submitting}
          sx={{ mb: 3 }}
          slotProps={{ input: { sx: { borderRadius: 2 } } }}
        />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {t("labels.finalNotes")}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder={t("labels.finalNotesPlaceholder")}
          value={notes}
          onChange={e => {
            setNotes(e.target.value);
          }}
          disabled={isLocked || submitting}
          error={!!validationErrors.notes}
          helperText={validationErrors.notes}
          slotProps={{ input: { sx: { borderRadius: 2 } } }}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          {t("labels.finalDecision")}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              variant={decision === "approve" ? "contained" : "outlined"}
              color="success"
              onClick={() => {
                if (!isLocked) setDecision("approve");
              }}
              disabled={isLocked || submitting}
              startIcon={<CheckCircleIcon />}
              sx={{ py: 2, borderRadius: 2, fontWeight: 800, fontSize: "1.1rem" }}
            >
              {t("actions.approveVehicle")}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button
              fullWidth
              variant={decision === "reject" ? "contained" : "outlined"}
              color="error"
              onClick={() => {
                if (!isLocked) setDecision("reject");
              }}
              disabled={isLocked || submitting}
              startIcon={<CancelIcon />}
              sx={{ py: 2, borderRadius: 2, fontWeight: 800, fontSize: "1.1rem" }}
            >
              {t("actions.rejectVehicle")}
            </Button>
          </Grid>
        </Grid>
        {validationErrors.decision && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block", fontWeight: 600 }}>
            {validationErrors.decision}
          </Typography>
        )}
      </Box>

      {!isLocked && (
        <Box sx={{ mt: 2, borderTop: 1, borderColor: "divider", pt: 4 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={handleConfirmSubmit}
            disabled={submitting}
            sx={{ py: 2, borderRadius: 3, fontWeight: 800, fontSize: "1.1rem" }}
          >
            {submitting ? <CircularProgress size={26} color="inherit" /> : t("actions.submitFinalReport")}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
