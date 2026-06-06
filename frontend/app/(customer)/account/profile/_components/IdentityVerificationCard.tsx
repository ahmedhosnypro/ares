"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

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

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NationalID: "National ID",
  Passport: "Passport",
};

function formatDocumentType(value: string): string {
  return DOCUMENT_TYPE_LABELS[value] ?? value;
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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
  const [internalState, setInternalState] = useState<LoadState>("loading");
  const [internalVerification, setInternalVerification] = useState<UserVerificationDto | null>(null);
  const [internalLoadError, setInternalLoadError] = useState<string>("");
  const [internalModalOpen, setInternalModalOpen] = useState(false);

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
      setInternalLoadError("Unable to load verification status.");
      setInternalState("error");
    }
  }, [accessToken, isControlled]);

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
          Identity Verification
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
            Try Again
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
                  label="Verified"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {verification?.documentType && (
                  <Typography variant="caption" color="text.secondary">
                    via {formatDocumentType(verification.documentType)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your identity has been verified. This badge increases trust with hosts and guests.
              </Typography>
            </>
          )}

          {status === "pending" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Pending Approval"
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
                Your verification is under review. We&apos;ll update your status once our team has finished reviewing
                your documents.
              </Typography>
              {verification?.submittedAt && (
                <Typography variant="caption" color="text.secondary">
                  Submitted {formatSubmittedAt(verification.submittedAt)}
                </Typography>
              )}
            </>
          )}

          {status === "rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Rejected"
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
                    Reason
                  </Typography>
                  <Typography variant="body2">{verification.rejectionReason}</Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Your previous verification was rejected. Please resubmit with clearer documents.
                </Typography>
              )}
            </>
          )}

          {status !== "approved" && status !== "pending" && status !== "rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Not verified"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Verify your identity to boost trust and unlock more features on ARES.
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
              {status === "rejected" ? "Resubmit Documents" : "Verify Identity"}
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
