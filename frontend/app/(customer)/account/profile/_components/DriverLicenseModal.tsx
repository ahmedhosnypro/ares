"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { submitDriverLicense, type DriverLicenseDto } from "@/api-clients/driver-license/driver-license";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface DriverLicenseModalProps {
  readonly open: boolean;
  readonly accessToken: string;
  readonly currentLicense: DriverLicenseDto | null;
  readonly onClose: () => void;
  readonly onSubmitted: (license: DriverLicenseDto) => void;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB to match backend

function isValidImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG or PNG images are allowed.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "The license image must be smaller than 10 MB.";
  }
  return null;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  // yyyy-MM-dd in UTC so the date input maps to the calendar day the user picked.
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDate(value: string): boolean {
  if (!value) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (isNaN(parsed.getTime())) return false;
  const todayUtc = new Date();
  const todayDateUtc = Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate());
  return parsed.getTime() > todayDateUtc;
}

export default function DriverLicenseModal({
  open,
  accessToken,
  currentLicense,
  onClose,
  onSubmitted,
}: DriverLicenseModalProps) {
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [licenseImage, setLicenseImage] = useState<File | null>(null);

  const [licenseNumberError, setLicenseNumberError] = useState<string>("");
  const [expiryDateError, setExpiryDateError] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset / prefill whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setLicenseNumber(currentLicense?.licenseNumber ?? "");
      setExpiryDate(toDateInputValue(currentLicense?.licenseExpiryDate));
      setLicenseImage(null);
      setLicenseNumberError("");
      setExpiryDateError("");
      setImageError("");
      setServerError("");
      setSubmitting(false);
    }
  }, [open, currentLicense]);

  const handleLicenseNumberChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseNumber(event.target.value);
    setLicenseNumberError("");
    setServerError("");
  }, []);

  const handleExpiryDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(event.target.value);
    setExpiryDateError("");
    setServerError("");
  }, []);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setServerError("");
    if (!file) {
      setLicenseImage(null);
      setImageError("");
      return;
    }
    const err = isValidImage(file);
    if (err) {
      setLicenseImage(null);
      setImageError(err);
      return;
    }
    setLicenseImage(file);
    setImageError("");
  }, []);

  const validateAll = useCallback((): boolean => {
    let valid = true;

    const trimmed = licenseNumber.trim();
    if (!trimmed) {
      setLicenseNumberError("License number is required.");
      valid = false;
    } else if (trimmed.length < 3 || trimmed.length > 50) {
      setLicenseNumberError("License number must be between 3 and 50 characters.");
      valid = false;
    }

    if (!expiryDate) {
      setExpiryDateError("Expiry date is required.");
      valid = false;
    } else if (!isFutureDate(expiryDate)) {
      setExpiryDateError("Expiry date must be in the future.");
      valid = false;
    }

    if (!licenseImage) {
      setImageError("License image is required.");
      valid = false;
    }

    return valid;
  }, [licenseNumber, expiryDate, licenseImage]);

  const canSubmit =
    !submitting &&
    !!licenseNumber.trim() &&
    !!expiryDate &&
    !!licenseImage &&
    !licenseNumberError &&
    !expiryDateError &&
    !imageError;

  const handleSubmit = useCallback(async () => {
    if (!validateAll()) return;
    if (!licenseImage) return; // narrowed for TS

    setSubmitting(true);
    setServerError("");

    try {
      const result = await submitDriverLicense(accessToken, {
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: expiryDate,
        licenseImage,
      });
      onSubmitted(result);
    } catch (error) {
      logger.error("Submit driver license error", error);
      if (error instanceof ApiError) {
        if (error.status === 400) {
          setServerError("The submitted information is invalid. Please review the fields and try again.");
        } else if (error.status === 401 || error.status === 403) {
          setServerError("Your session has expired. Please sign in again.");
        } else if (error.status === 409) {
          setServerError("There is already a pending request for this license.");
        } else {
          setServerError("Could not submit driver license. Please try again in a moment.");
        }
      } else {
        setServerError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, expiryDate, licenseImage, licenseNumber, onSubmitted, validateAll]);

  // Today (UTC) as yyyy-MM-dd, used to enforce `min` on the date input.
  const todayMin = toDateInputValue(new Date().toISOString());

  let submitButtonText = "Submit for review";
  if (submitting) {
    submitButtonText = "Submitting...";
  } else if (currentLicense) {
    submitButtonText = "Update license";
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 800,
          pr: 1.5,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {currentLicense ? "Update driver license" : "Submit driver license"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload a clear photo of your valid driver license. Our team will review it shortly.
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} disabled={submitting} size="small" sx={{ ml: 1 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: "border.light" }} />

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {serverError && (
            <Alert severity="error" variant="outlined">
              {serverError}
            </Alert>
          )}

          <TextField
            id="driver-license-number"
            label="License number"
            value={licenseNumber}
            onChange={handleLicenseNumberChange}
            error={!!licenseNumberError}
            helperText={licenseNumberError || " "}
            disabled={submitting}
            slotProps={{ htmlInput: { maxLength: 50 } }}
            fullWidth
          />

          <TextField
            id="driver-license-expiry"
            label="Expiry date"
            type="date"
            value={expiryDate}
            onChange={handleExpiryDateChange}
            error={!!expiryDateError}
            helperText={expiryDateError || " "}
            disabled={submitting}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { min: todayMin },
            }}
            fullWidth
          />

          <ImageFileField
            id="driver-license-image"
            label="License image"
            file={licenseImage}
            error={imageError}
            disabled={submitting}
            onChange={handleImageChange}
          />

          <Typography variant="caption" color="text.secondary">
            Accepted formats: JPG, PNG. Max 10 MB.
          </Typography>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: "border.light" }} />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <UploadFileRoundedIcon />}
          sx={{ fontWeight: 700 }}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ImageFileFieldProps {
  readonly id: string;
  readonly label: string;
  readonly file: File | null;
  readonly error: string;
  readonly disabled: boolean;
  readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function ImageFileField({ id, label, file, error, disabled, onChange }: ImageFileFieldProps) {
  // Generate a transient object URL purely for preview while the modal is open.
  // Stored in state and managed via effect so we don't recreate it every render.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <Box>
      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mb: 0.75 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Button
          component="label"
          variant="outlined"
          color="primary"
          startIcon={<UploadFileRoundedIcon />}
          disabled={disabled}
          sx={{ fontWeight: 700 }}
        >
          {file ? "Replace file" : "Choose file"}
          <input id={id} type="file" accept={ACCEPT_ATTRIBUTE} hidden onChange={onChange} disabled={disabled} />
        </Button>
        {file && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <CheckCircleRoundedIcon color="success" sx={{ fontSize: 18 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: 220,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={file.name}
            >
              {file.name}
            </Typography>
          </Box>
        )}
      </Box>
      {previewUrl && (
        <Box
          sx={{
            mt: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "border.light",
            overflow: "hidden",
            maxWidth: 220,
            bgcolor: "background.default",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL preview only */}
          <img
            src={previewUrl}
            alt="License preview"
            style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }}
          />
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
