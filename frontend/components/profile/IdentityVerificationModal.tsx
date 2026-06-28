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
import { useTranslations } from "next-intl";

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

function isValidImage(file: File): "invalidFileType" | "fileTooLarge" | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "invalidFileType";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "fileTooLarge";
  }
  return null;
}

export default function IdentityVerificationModal({
  open,
  accessToken,
  onClose,
  onSubmitted,
}: IdentityVerificationModalProps) {
  const t = useTranslations("customer.accountProfile");
  const [documentType, setDocumentType] = useState<VerificationDocumentType>("NationalID");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const [frontError, setFrontError] = useState<string>("");
  const [backError, setBackError] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const backImageRequired = documentType === "NationalID";
  const backImageLabel = useMemo(
    () =>
      backImageRequired ? t("identityVerificationModal.backImage") : t("identityVerificationModal.backImageOptional"),
    [backImageRequired, t]
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

  const handleFrontChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
        setFrontError(t(`identityVerificationModal.${err}`));
        return;
      }
      setFrontImage(file);
      setFrontError("");
    },
    [t]
  );

  const handleBackChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
        setBackError(t(`identityVerificationModal.${err}`));
        return;
      }
      setBackImage(file);
      setBackError("");
    },
    [t]
  );

  const canSubmit = !submitting && !!frontImage && !frontError && !backError && (!backImageRequired || !!backImage);

  const handleSubmit = useCallback(async () => {
    if (!frontImage) {
      setFrontError(t("identityVerificationModal.frontImageRequired"));
      return;
    }
    if (backImageRequired && !backImage) {
      setBackError(t("identityVerificationModal.backImageRequired"));
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
          setServerError(t("identityVerificationModal.existingRequest"));
        } else if (error.status === 400) {
          setServerError(t("identityVerificationModal.invalidDocuments"));
        } else if (error.status === 401 || error.status === 403) {
          setServerError(t("identityVerificationModal.sessionExpired"));
        } else {
          setServerError(t("identityVerificationModal.submitFailed"));
        }
      } else {
        setServerError(t("identityVerificationModal.networkError"));
      }
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, backImage, backImageRequired, documentType, frontImage, onSubmitted, t]);

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
            {t("identityVerificationModal.title")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("identityVerificationModal.subtitle")}
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
            <InputLabel id="verification-document-type-label">{t("identityVerificationModal.documentType")}</InputLabel>
            <Select
              labelId="verification-document-type-label"
              id="verification-document-type"
              label={t("identityVerificationModal.documentType")}
              value={documentType}
              onChange={handleDocumentTypeChange}
              disabled={submitting}
            >
              <MenuItem value="NationalID">{t("identityVerification.nationalID")}</MenuItem>
              <MenuItem value="Passport">{t("identityVerification.passport")}</MenuItem>
            </Select>
          </FormControl>

          <FileField
            id="verification-front-image"
            label={t("identityVerificationModal.frontImage")}
            file={frontImage}
            error={frontError}
            disabled={submitting}
            onChange={handleFrontChange}
            replaceFileText={t("identityVerificationModal.replaceFile")}
            chooseFileText={t("identityVerificationModal.chooseFile")}
          />

          <FileField
            id="verification-back-image"
            label={backImageLabel}
            file={backImage}
            error={backError}
            disabled={submitting}
            onChange={handleBackChange}
            replaceFileText={t("identityVerificationModal.replaceFile")}
            chooseFileText={t("identityVerificationModal.chooseFile")}
          />

          <Typography variant="caption" color="text.secondary">
            {t("identityVerificationModal.acceptedFormats")}
          </Typography>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: "border.light" }} />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          {t("identityVerificationModal.cancel")}
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
          {submitting ? t("identityVerificationModal.submitting") : t("identityVerificationModal.submitForReview")}
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
  readonly replaceFileText: string;
  readonly chooseFileText: string;
}

function FileField({ id, label, file, error, disabled, onChange, replaceFileText, chooseFileText }: FileFieldProps) {
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
          {file ? replaceFileText : chooseFileText}
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
