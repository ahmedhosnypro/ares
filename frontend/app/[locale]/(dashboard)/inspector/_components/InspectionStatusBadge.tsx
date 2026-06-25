"use client";

import { Chip, useTheme, alpha } from "@mui/material";

interface Props {
  readonly status: string;
  readonly size?: "small" | "medium";
}

/**
 * Consistent status badge used throughout the inspection UI:
 *   Pending  → yellow
 *   Approved → green
 *   Rejected → red
 */
export default function InspectionStatusBadge({ status, size = "small" }: Props) {
  const theme = useTheme();
  const palette: Record<string, { bg: string; color: string; label: string }> = {
    Pending: {
      bg: alpha(theme.palette.warning.main, 0.15),
      color: theme.palette.warning.main,
      label: "Pending",
    },
    Approved: {
      bg: alpha(theme.palette.success.main, 0.15),
      color: theme.palette.success.main,
      label: "Approved",
    },
    Rejected: {
      bg: alpha(theme.palette.error.main, 0.15),
      color: theme.palette.error.main,
      label: "Rejected",
    },
  };
  const c = palette[status] ?? {
    bg: alpha(theme.palette.grey[500], 0.15),
    color: theme.palette.text.primary,
    label: status,
  };

  return <Chip label={c.label} size={size} sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700 }} />;
}
