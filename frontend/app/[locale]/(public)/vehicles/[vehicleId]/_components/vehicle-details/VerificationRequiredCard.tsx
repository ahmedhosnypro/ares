"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import type { VerificationStatus } from "@/hooks/useVerificationStatus";

/**
 * URL of the profile section where the user can submit / track their
 * identity verification. Exported so other call-sites (e.g. checkout)
 * can link to the same place without forking the path.
 */
export const VERIFICATION_PROFILE_URL = "/account/profile#identity-verification";

interface VerificationRequiredCardProps {
  /** Discriminated status from `useVerificationStatus()`. */
  readonly status: VerificationStatus | null;
  /** True while the hook is still resolving the session / fetching. */
  readonly loading?: boolean;
  /** Optional non-fatal error message from the status fetch. */
  readonly error?: string | null;
}

interface StatusContent {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly icon: typeof WarningAmberOutlinedIcon;
  /**
   * Logical role for the surface — drives the colour palette without
   * hard-coding hex values. Maps to MUI theme palette keys.
   */
  readonly tone: "warning" | "info" | "error" | "primary" | "secondary";
}

const STATUS_CONTENT: Record<Exclude<VerificationStatus, "Approved">, StatusContent> = {
  NotSubmitted: {
    title: "Identity Verification Required",
    body: "Complete your identity verification to enable booking features. It's a one-time process to ensure a safe rental experience.",
    cta: "Verify Identity",
    icon: WarningAmberOutlinedIcon,
    tone: "warning",
  },
  Pending: {
    title: "Verification in Progress",
    body: "Our team is currently reviewing your documents. This typically takes a few hours. We'll notify you as soon as you're cleared to book.",
    cta: "Check Status",
    icon: HourglassTopRoundedIcon,
    tone: "secondary",
  },
  Rejected: {
    title: "Verification Unsuccessful",
    body: "Your identity verification could not be approved. Please review the requirements and re-submit your documents.",
    cta: "Re-submit Identity",
    icon: ErrorOutlineRoundedIcon,
    tone: "error",
  },
};

/**
 * High-fidelity, professional status card for identity verification.
 * Designed to be placed as a dedicated section on the page.
 */
export default function VerificationRequiredCard({
  status,
  loading = false,
  error = null,
}: VerificationRequiredCardProps) {
  const theme = useTheme();
  const router = useRouter();

  if (loading) {
    return (
      <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="70%" height={20} />
          </Stack>
        </Stack>
      </Box>
    );
  }

  if (status === "Approved") {
    return null;
  }

  const key = status ?? "NotSubmitted";
  const content = STATUS_CONTENT[key];
  const Icon = content.icon;
  const tone = content.tone;

  const goToVerification = () => {
    router.push(VERIFICATION_PROFILE_URL);
  };

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: alpha(theme.palette[tone].main, 0.03),
        border: "1px solid",
        borderColor: alpha(theme.palette[tone].main, 0.12),
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: alpha(theme.palette[tone].main, 0.25),
          bgcolor: alpha(theme.palette[tone].main, 0.05),
          transform: "translateY(-2px)",
          boxShadow: `0 12px 30px -10px ${alpha(theme.palette[tone].main, 0.15)}`,
        },
      }}
    >
      {/* Accent bar */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          bgcolor: theme.palette[tone].main,
          opacity: 0.8,
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{
          p: { xs: 3, md: 4 },
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: alpha(theme.palette[tone].main, 0.1),
            color: theme.palette[tone].main,
            flexShrink: 0,
            boxShadow: `0 8px 20px -6px ${alpha(theme.palette[tone].main, 0.25)}`,
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>

        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.01em" }}>
            {content.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 600, lineHeight: 1.6 }}>
            {content.body}
          </Typography>
          {error && (
            <Typography variant="caption" sx={{ color: "error.main", mt: 1, fontWeight: 600 }}>
              {error}
            </Typography>
          )}
        </Stack>

        <Button
          variant="contained"
          color={tone}
          endIcon={<KeyboardArrowRightRoundedIcon />}
          onClick={goToVerification}
          sx={{
            minWidth: 180,
            height: 48,
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: `0 8px 20px -8px ${alpha(theme.palette[tone].main, 0.4)}`,
            "&:hover": {
              boxShadow: `0 12px 25px -8px ${alpha(theme.palette[tone].main, 0.5)}`,
            },
          }}
        >
          {content.cta}
        </Button>
      </Stack>
    </Box>
  );
}
