"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import {
  submitVerification,
  type UserVerificationDto,
  type VerificationDocumentType,
} from "@/api-clients/verifications/verifications";
import { ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface IdentityVerificationModalProps {
  readonly open: boolean;
  readonly accessToken: string;
  readonly onClose: () => void;
  readonly onSubmitted: (verification: UserVerificationDto) => void;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function isValidImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WEBP images or PDF files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Each file must be smaller than 5 MB.";
  }
  return null;
}

export default function IdentityVerificationModal({
  open,
  accessToken,
  onClose,
  onSubmitted,
}: IdentityVerificationModalProps) {
  const [documentType, setDocumentType] = useState<VerificationDocumentType>("NationalID");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const [frontError, setFrontError] = useState<string>("");
  const [backError, setBackError] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const backImageRequired = documentType === "NationalID";
  const backImageLabel = useMemo(
    () => (backImageRequired ? "Back image" : "Back image (optional)"),
    [backImageRequired]
  );

  useEffect(() => {
    if (!open) {
      setDocumentType("NationalID");
      setFrontImage(null);
      setBackImage(null);
      setFrontError("");
      setBackError("");
      setServerError("");
      setSubmitting(false);
    }
  }, [open]);

  const handleDocumentTypeChange = useCallback((event: SelectChangeEvent) => {
    setDocumentType(event.target.value as VerificationDocumentType);
    setServerError("");
  }, []);

  const handleFrontChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setServerError("");
    if (!file) {
      setFrontImage(null);
      setFrontError("");
      return;
    }
    const err = isValidImage(file);
    if (err) {
      setFrontImage(null);
      setFrontError(err);
      return;
    }
    setFrontImage(file);
    setFrontError("");
  }, []);

  const handleBackChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setServerError("");
    if (!file) {
      setBackImage(null);
      setBackError("");
      return;
    }
    const err = isValidImage(file);
    if (err) {
      setBackImage(null);
      setBackError(err);
      return;
    }
    setBackImage(file);
    setBackError("");
  }, []);

  const canSubmit = !submitting && !!frontImage && !frontError && !backError && (!backImageRequired || !!backImage);

  const handleSubmit = useCallback(async () => {
    if (!frontImage) {
      setFrontError("Please upload the front of your document.");
      return;
    }
    if (backImageRequired && !backImage) {
      setBackError("Please upload the back of your National ID.");
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      const result = await submitVerification(accessToken, {
        documentType,
        frontImage,
        backImage: backImage ?? null,
      });
      onSubmitted(result);
    } catch (error) {
      logger.error("Submit verification error", error);
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setServerError("You already have a pending or approved verification request.");
        } else if (error.status === 400) {
          setServerError("The submitted documents are invalid. Please check the files and try again.");
        } else if (error.status === 401 || error.status === 403) {
          setServerError("Your session has expired. Please sign in again.");
        } else {
          setServerError("Could not submit verification. Please try again in a moment.");
        }
      } else {
        setServerError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, backImage, backImageRequired, documentType, frontImage, onSubmitted]);

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
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
            Verify your identity
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload a government-issued document. Our team will review it shortly.
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

          <FormControl fullWidth>
            <InputLabel id="verification-document-type-label">Document type</InputLabel>
            <Select
              labelId="verification-document-type-label"
              id="verification-document-type"
              label="Document type"
              value={documentType}
              onChange={handleDocumentTypeChange}
              disabled={submitting}
            >
              <MenuItem value="NationalID">National ID</MenuItem>
              <MenuItem value="Passport">Passport</MenuItem>
            </Select>
          </FormControl>

          <FileField
            id="verification-front-image"
            label="Front image"
            file={frontImage}
            error={frontError}
            disabled={submitting}
            onChange={handleFrontChange}
          />

          <FileField
            id="verification-back-image"
            label={backImageLabel}
            file={backImage}
            error={backError}
            disabled={submitting}
            onChange={handleBackChange}
          />

          <Typography variant="caption" color="text.secondary">
            Accepted formats: JPG, PNG, WEBP, PDF. Max 5 MB per file.
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
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface FileFieldProps {
  readonly id: string;
  readonly label: string;
  readonly file: File | null;
  readonly error: string;
  readonly disabled: boolean;
  readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function FileField({ id, label, file, error, disabled, onChange }: FileFieldProps) {
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
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
