"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlinedRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDateTime } from "@/utils/dateTime";

import { getMyVerification, type UserVerificationDto } from "@/api-clients/verifications/verifications";
import { logger } from "@/utils/logger";
import IdentityVerificationModal from "./IdentityVerificationModal";

interface IdentityVerificationCardProps {
  readonly accessToken: string;
  readonly externalState?: LoadState;
  readonly externalVerification?: UserVerificationDto | null;
  readonly externalLoadError?: string;
  readonly externalModalOpen?: boolean;
  readonly onOpenModal?: () => void;
  readonly onCloseModal?: () => void;
  readonly onSubmitted?: (next: UserVerificationDto) => void;
}

type LoadState = "loading" | "ready" | "error";

function formatSubmittedAt(value: string, locale: string): string {
  return formatUtcDateTime(value, locale, { year: "numeric", month: "short", day: "numeric" }, "");
}

export default function IdentityVerificationCard({
  accessToken,
  externalState,
  externalVerification,
  externalLoadError,
  externalModalOpen,
  onOpenModal,
  onCloseModal,
  onSubmitted,
}: IdentityVerificationCardProps) {
  const t = useTranslations("customer.accountProfile");
  const locale = useLocale();
  const [internalState, setInternalState] = useState<LoadState>("loading");
  const [internalVerification, setInternalVerification] = useState<UserVerificationDto | null>(null);
  const [internalLoadError, setInternalLoadError] = useState<string>("");
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const formatDocumentType = useCallback(
    (value: string): string => {
      if (value === "NationalID") return t("identityVerification.nationalID");
      if (value === "Passport") return t("identityVerification.passport");
      return value;
    },
    [t]
  );

  const isControlled = externalState !== undefined;

  const state = isControlled ? externalState : internalState;
  const verification = isControlled ? externalVerification : internalVerification;
  const loadError = isControlled ? (externalLoadError ?? "") : internalLoadError;
  const modalOpen = isControlled ? (externalModalOpen ?? false) : internalModalOpen;

  const load = useCallback(async () => {
    if (isControlled) return;
    setInternalState("loading");
    setInternalLoadError("");
    try {
      const data = await getMyVerification(accessToken);
      setInternalVerification(data);
      setInternalState("ready");
    } catch (error) {
      logger.error("Failed to load verification status", error);
      setInternalLoadError(t("identityVerification.loadError"));
      setInternalState("error");
    }
  }, [accessToken, isControlled, t]);

  useEffect(() => {
    if (!isControlled) {
      void load();
    }
  }, [load, isControlled]);

  const handleSubmitted = useCallback(
    (next: UserVerificationDto) => {
      if (isControlled) {
        onSubmitted?.(next);
      } else {
        setInternalVerification(next);
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

  const status = (verification?.status ?? "NotVerified").toLowerCase();
  const canSubmit = status === "notVerified".toLowerCase() || status === "rejected";

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>
          {t("identityVerification.title")}
        </Typography>
        <BadgeRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
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
            {t("identityVerification.tryAgain")}
          </Button>
        </Stack>
      )}

      {state === "ready" && (
        <Stack spacing={2}>
          {status === "approved" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<VerifiedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("identityVerification.verified")}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {verification?.documentType && (
                  <Typography variant="caption" color="text.secondary">
                    {t("identityVerification.via")} {formatDocumentType(verification.documentType)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("identityVerification.verifiedDescription")}
              </Typography>
            </>
          )}

          {status === "pending" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("identityVerification.pendingApproval")}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {verification?.documentType && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDocumentType(verification.documentType)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("identityVerification.pendingDescription")}
              </Typography>
              {verification?.submittedAt && (
                <Typography variant="caption" color="text.secondary">
                  {t("identityVerification.submitted")} {formatSubmittedAt(verification.submittedAt, locale)}
                </Typography>
              )}
            </>
          )}

          {status === "rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlinedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("identityVerification.rejected")}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {verification?.documentType && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDocumentType(verification.documentType)}
                  </Typography>
                )}
              </Box>
              {verification?.rejectionReason ? (
                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                    {t("identityVerification.reason")}
                  </Typography>
                  <Typography variant="body2">{verification.rejectionReason}</Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("identityVerification.rejectedNoReasonDescription")}
                </Typography>
              )}
            </>
          )}

          {status !== "approved" && status !== "pending" && status !== "rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlinedRoundedIcon sx={{ fontSize: 16 }} />}
                  label={t("identityVerification.notVerified")}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t("identityVerification.notVerifiedDescription")}
              </Typography>
            </>
          )}

          {canSubmit && (
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<UploadFileRoundedIcon />}
              onClick={handleOpenModal}
              sx={{ fontWeight: 700, alignSelf: "flex-start" }}
            >
              {status === "rejected"
                ? t("identityVerification.resubmitDocuments")
                : t("identityVerification.verifyIdentity")}
            </Button>
          )}
        </Stack>
      )}

      <IdentityVerificationModal
        open={modalOpen}
        accessToken={accessToken}
        onClose={handleCloseModal}
        onSubmitted={handleSubmitted}
      />
    </Box>
  );
}
