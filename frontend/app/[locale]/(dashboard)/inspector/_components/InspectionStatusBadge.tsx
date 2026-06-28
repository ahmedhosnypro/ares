"use client";

import { useTranslations } from "next-intl";
import { Chip, useTheme, alpha } from "@mui/material";

interface Props {
  readonly status: string;
  readonly size?: "small" | "medium";
}

export default function InspectionStatusBadge({ status, size = "small" }: Props) {
  const theme = useTheme();
  const t = useTranslations("dashboardInspector.inspections");
  const palette: Record<string, { bg: string; color: string; label: string }> = {
    Pending: {
      bg: alpha(theme.palette.warning.main, 0.15),
      color: theme.palette.warning.main,
      label: t("status.pending"),
    },
    Approved: {
      bg: alpha(theme.palette.success.main, 0.15),
      color: theme.palette.success.main,
      label: t("status.approved"),
    },
    Rejected: {
      bg: alpha(theme.palette.error.main, 0.15),
      color: theme.palette.error.main,
      label: t("status.rejected"),
    },
  };
  const c = palette[status] ?? {
    bg: alpha(theme.palette.grey[500], 0.15),
    color: theme.palette.text.primary,
    label: status,
  };

  return <Chip label={c.label} size={size} sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700 }} />;
}
