"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import DriveEtaRoundedIcon from "@mui/icons-material/DriveEtaRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import {
  getMyDriverLicense,
  type DriverLicenseDto,
  type DriverLicenseVerificationState,
} from "@/api-clients/driver-license/driver-license";
import { logger } from "@/utils/logger";
import DriverLicenseModal from "./DriverLicenseModal";

interface DriverLicenseCardProps {
  readonly accessToken: string;
}

type LoadState = "loading" | "ready" | "error";

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function deriveState(license: DriverLicenseDto | null): DriverLicenseVerificationState {
  if (!license) return "NotSubmitted";
  if (license.verificationState) return license.verificationState;
  return license.isVerified ? "Verified" : "Pending";
}

export default function DriverLicenseCard({ accessToken }: DriverLicenseCardProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [license, setLicense] = useState<DriverLicenseDto | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    setLoadError("");
    try {
      const data = await getMyDriverLicense(accessToken);
      setLicense(data);
      setState("ready");
    } catch (error) {
      logger.error("Failed to load driver license status", error);
      setLoadError("Unable to load driver license status.");
      setState("error");
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial async fetch on mount
    void load();
  }, [load]);

  const handleSubmitted = useCallback((next: DriverLicenseDto) => {
    setLicense(next);
    setModalOpen(false);
  }, []);

  const verificationState = useMemo(() => deriveState(license), [license]);
  const canSubmit =
    verificationState === "NotSubmitted" ||
    verificationState === "Rejected" ||
    verificationState === "Pending" ||
    verificationState === "Verified";

  const buttonLabel =
    verificationState === "NotSubmitted"
      ? "Upload License"
      : verificationState === "Rejected"
        ? "Resubmit License"
        : "Update License";

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>
          Driver License
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
            Try Again
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
                  label="Verified"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {license?.licenseExpiryDate && (
                  <Typography variant="caption" color="text.secondary">
                    Expires {formatDate(license.licenseExpiryDate)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your driver license has been verified. Keep it up to date to remain eligible for bookings.
              </Typography>
            </>
          )}

          {verificationState === "Pending" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Pending review"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
                {license?.licenseExpiryDate && (
                  <Typography variant="caption" color="text.secondary">
                    Expires {formatDate(license.licenseExpiryDate)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your driver license is under review. We&apos;ll update your status once our team has finished
                reviewing your documents.
              </Typography>
              {license?.submittedAt && (
                <Typography variant="caption" color="text.secondary">
                  Submitted {formatDate(license.submittedAt)}
                </Typography>
              )}
            </>
          )}

          {verificationState === "Rejected" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Rejected"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              {license?.rejectionReason ? (
                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                    Reason
                  </Typography>
                  <Typography variant="body2">{license.rejectionReason}</Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Your previous driver license submission was rejected. Please re-upload a clearer copy.
                </Typography>
              )}
            </>
          )}

          {verificationState === "NotSubmitted" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Not submitted"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Upload your driver license to become eligible for bookings on ARES.
              </Typography>
            </>
          )}

          {canSubmit && (
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<UploadFileRoundedIcon />}
              onClick={() => {
                setModalOpen(true);
              }}
              sx={{ fontWeight: 700, alignSelf: "flex-start" }}
            >
              {buttonLabel}
            </Button>
          )}
        </Stack>
      )}

      <DriverLicenseModal
        open={modalOpen}
        accessToken={accessToken}
        currentLicense={license}
        onClose={() => {
          setModalOpen(false);
        }}
        onSubmitted={handleSubmitted}
      />
    </Box>
  );
}
