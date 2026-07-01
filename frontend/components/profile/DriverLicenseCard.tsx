"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlinedRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import DriveEtaRoundedIcon from "@mui/icons-material/DriveEtaRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";

import {
  getMyDriverLicense,
  type DriverLicenseDto,
  type DriverLicenseVerificationState,
} from "@/api-clients/driver-license/driver-license";
import { logger } from "@/utils/logger";
import DriverLicenseModal from "./DriverLicenseModal";

interface DriverLicenseCardProps {
  readonly accessToken: string;
  readonly externalState?: LoadState;
  readonly externalLicense?: DriverLicenseDto | null;
  readonly externalLoadError?: string;
  readonly externalModalOpen?: boolean;
  readonly onOpenModal?: () => void;
  readonly onCloseModal?: () => void;
  readonly onSubmitted?: (next: DriverLicenseDto) => void;
}

type LoadState = "loading" | "ready" | "error";

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "";
  return formatUtcDate(value, locale, { year: "numeric", month: "short", day: "numeric" }, "");
}

function deriveState(license: DriverLicenseDto | null): DriverLicenseVerificationState {
  if (!license) return "NotSubmitted";
  if (license.verificationState) return license.verificationState;
  return license.isVerified ? "Verified" : "Pending";
}

export default function DriverLicenseCard({
  accessToken,
  externalState,
  externalLicense,
  externalLoadError,
  externalModalOpen,
  onOpenModal,
  onCloseModal,
  onSubmitted,
}: DriverLicenseCardProps) {
  const t = useTranslations("customer.accountProfile");
  const locale = useLocale();
  const [internalState, setInternalState] = useState<LoadState>("loading");
  const [internalLicense, setInternalLicense] = useState<DriverLicenseDto | null>(null);
  const [internalLoadError, setInternalLoadError] = useState<string>("");
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const isControlled = externalState !== undefined;

  const state = isControlled ? externalState : internalState;
  const license = isControlled ? (externalLicense ?? null) : internalLicense;
  const loadError = isControlled ? (externalLoadError ?? "") : internalLoadError;
  const modalOpen = isControlled ? (externalModalOpen ?? false) : internalModalOpen;

  const load = useCallback(async () => {
    if (isControlled) return;
    setInternalState("loading");
    setInternalLoadError("");
    try {
      const data = await getMyDriverLicense(accessToken);
      setInternalLicense(data);
      setInternalState("ready");
    } catch (error) {
      logger.error("Failed to load driver license status", error);
      setInternalLoadError(t("driverLicense.loadError"));
      setInternalState("error");
    }
  }, [accessToken, isControlled, t]);

  useEffect(() => {
    if (!isControlled) {
      void load();
    }
  }, [load, isControlled]);

  const handleSubmitted = useCallback(
    (next: DriverLicenseDto) => {
      if (isControlled) {
        onSubmitted?.(next);
      } else {
        setInternalLicense(next);
        setInternalModalOpen(false);
      }
    },
    [isControlled, onSubmitted]
  );

  const handleOpenModal = useCallback(() => {
    if (isControlled) {
      onOpenModal?.();
    } else {
      setInternalModalOpen(true);
    }
  }, [isControlled, onOpenModal]);

  const handleCloseModal = useCallback(() => {
    if (isControlled) {
      onCloseModal?.();
    } else {
      setInternalModalOpen(false);
    }
  }, [isControlled, onCloseModal]);

  const verificationState = useMemo(() => deriveState(license), [license]);

  let buttonLabel = t("driverLicense.updateLicense");
  if (verificationState === "NotSubmitted") {
    buttonLabel = t("driverLicense.uploadLicense");
  } else if (verificationState === "Rejected") {
    buttonLabel = t("driverLicense.resubmitLicense");
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>
          {t("driverLicense.title")}
        </Typography>
        <DriveEtaRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
      </Box>
      <Divider sx={{ mb: 2, borderColor: "border.light" }} />

      {state === "loading" && (
        <Stack spacing={1.5} sx={{ py: 1 }}>
          <Skeleton variant="rounded" height={28} />
          <Skeleton variant="text" />
          <Skeleton variant="rounded" height={36} />
        </Stack>
      )}

      {state === "error" && (
        <Stack spacing={2}>
          <Alert severity="error" variant="outlined">
            {loadError}
          </Alert>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              void load();
            }}
            sx={{ fontWeight: 700 }}
          >
            {t("driverLicense.tryAgain")}
          </Button>
        </Stack>
      )}

      {state === "ready" && (
        <Stack spacing={2}>
          {verificationState === "Verified" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={<VerifiedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("driverLicense.verified")}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {license?.licenseExpiryDate && (
                  <Typography variant="caption" color="text.secondary">
                    {t("driverLicense.expires")} {formatDate(license.licenseExpiryDate, locale)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("driverLicense.verifiedDescription")}
              </Typography>
            </>
          )}

          {verificationState === "Pending" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("driverLicense.pendingReview")}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {license?.licenseExpiryDate && (
                  <Typography variant="caption" color="text.secondary">
                    {t("driverLicense.expires")} {formatDate(license.licenseExpiryDate, locale)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("driverLicense.pendingDescription")}
              </Typography>
              {license?.submittedAt && (
                <Typography variant="caption" color="text.secondary">
                  {t("driverLicense.submitted")} {formatDate(license.submittedAt, locale)}
                </Typography>
              )}
            </>
          )}

          {verificationState === "Rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={<ErrorOutlinedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("driverLicense.rejected")}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              {license?.rejectionReason ? (
                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                    {t("driverLicense.reason")}
                  </Typography>
                  <Typography variant="body2">{license.rejectionReason}</Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("driverLicense.rejectedNoReasonDescription")}
                </Typography>
              )}
            </>
          )}

          {verificationState === "NotSubmitted" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlinedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("driverLicense.notSubmitted")}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("driverLicense.notSubmittedDescription")}
              </Typography>
            </>
          )}

          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<UploadFileRoundedIcon />}
            onClick={handleOpenModal}
            sx={{ fontWeight: 700, alignSelf: "flex-start" }}
          >
            {buttonLabel}
          </Button>
        </Stack>
      )}

      <DriverLicenseModal
        open={modalOpen}
        accessToken={accessToken}
        currentLicense={license}
        onClose={handleCloseModal}
        onSubmitted={handleSubmitted}
      />
    </Box>
  );
}
