"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Stack, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
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
  readonly icon: typeof WarningAmberRoundedIcon;
  /**
   * Logical role for the surface — drives the colour palette without
   * hard-coding hex values. Maps to MUI theme palette keys.
   */
  readonly tone: "warning" | "info" | "error";
}

const STATUS_CONTENT: Record<Exclude<VerificationStatus, "Approved">, StatusContent> = {
  NotSubmitted: {
    title: "Verify your identity to book",
    body: "Complete your identity verification to book this vehicle. It takes only a couple of minutes and protects your account.",
    cta: "Start verification",
    icon: WarningAmberRoundedIcon,
    tone: "warning",
  },
  Pending: {
    title: "Verification in review",
    body: "Your documents are being reviewed by our team. You'll be able to book a vehicle as soon as your verification is approved.",
    cta: "View verification status",
    icon: HourglassTopRoundedIcon,
    tone: "info",
  },
  Rejected: {
    title: "Verification was rejected",
    body: "Your last identity verification was rejected. Please re-submit your documents to continue with booking.",
    cta: "Re-submit verification",
    icon: ErrorOutlineRoundedIcon,
    tone: "error",
  },
};

/**
 * Modern, mobile-first warning card shown on the booking surfaces when a
 * customer is not approved for booking.
 *
 * Design notes:
 *   - whole card is clickable + role="button" so any tap area routes
 *     the user to the Profile → Verification section (spec requirement);
 *   - status icon + colour tone vary per state (NotSubmitted / Pending
 *     / Rejected) so users know exactly what action is expected;
 *   - colours all come from `theme.palette.<tone>.{main,light}` via
 *     `alpha(...)` — no hard-coded hex values (follows the project's
 *     theme rule in AGENTS.md);
 *   - responsive padding via the `sx` breakpoint syntax so the card
 *     stays comfortable on mobile (`xs`) and feels intentional on
 *     laptop (`md`);
 *   - loading state uses MUI `Skeleton` matching the card height to
 *     prevent layout shift when the hook resolves.
 */
export default function VerificationRequiredCard({
  status,
  loading = false,
  error = null,
}: VerificationRequiredCardProps) {
  const theme = useTheme();
  const router = useRouter();

  if (loading) {
    return <Skeleton variant="rounded" width="100%" height={208} sx={{ borderRadius: 3 }} />;
  }

  if (status === "Approved") {
    // Approved users see the regular booking CTA — nothing to render here.
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
      role="button"
      tabIndex={0}
      aria-label={`${content.title}. Open profile verification.`}
      onClick={goToVerification}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToVerification();
        }
      }}
      sx={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 3,
        p: { xs: 2.25, sm: 3 },
        bgcolor: alpha(theme.palette[tone].main, 0.06),
        border: "1px solid",
        borderColor: alpha(theme.palette[tone].main, 0.32),
        boxShadow: `0 6px 16px -8px ${alpha(theme.palette[tone].main, 0.45)}`,
        transition: theme.transitions.create(["box-shadow", "transform", "border-color", "background-color"], {
          duration: theme.transitions.duration.shorter,
        }),
        "&:hover": {
          borderColor: alpha(theme.palette[tone].main, 0.55),
          boxShadow: `0 10px 22px -8px ${alpha(theme.palette[tone].main, 0.55)}`,
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "none",
          borderColor: theme.palette[tone].main,
          boxShadow: `0 0 0 3px ${alpha(theme.palette[tone].main, 0.35)}`,
        },
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 2 }} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette[tone].main, 0.16),
            color: `${tone}.main`,
            flexShrink: 0,
          }}
        >
          <Icon fontSize="medium" />
        </Box>

        <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
            {content.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {content.body}
          </Typography>

          {error && (
            <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            color={tone}
            size="medium"
            startIcon={<VerifiedUserOutlinedIcon />}
            onClick={e => {
              // Don't double-fire — the wrapper Box also routes on click.
              e.stopPropagation();
              goToVerification();
            }}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              mt: 0.5,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.25,
            }}
          >
            {content.cta}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
