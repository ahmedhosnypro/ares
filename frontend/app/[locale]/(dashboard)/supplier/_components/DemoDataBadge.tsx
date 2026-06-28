"use client";

import { Chip, Tooltip, alpha, useTheme } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import { useTranslations } from "next-intl";

interface DemoDataBadgeProps {
  readonly label?: string;
  readonly tooltip?: string;
}

export default function DemoDataBadge({ label, tooltip }: DemoDataBadgeProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.supplierNotifications");

  const resolvedLabel = label ?? t("demoDataLabel");
  const resolvedTooltip = tooltip ?? t("demoDataTooltip");

  return (
    <Tooltip title={resolvedTooltip} arrow placement="top">
      <Chip
        icon={<ScienceIcon sx={{ fontSize: 14 }} />}
        label={resolvedLabel}
        size="small"
        variant="outlined"
        sx={{
          height: 22,
          fontSize: "0.68rem",
          fontWeight: 600,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          color: "text.secondary",
          borderColor: alpha(theme.palette.text.secondary, 0.3),
          bgcolor: alpha(theme.palette.text.secondary, 0.04),
          "& .MuiChip-icon": {
            color: "text.secondary",
            ml: 0.6,
            mr: -0.5,
          },
          "& .MuiChip-label": {
            px: 1,
          },
        }}
      />
    </Tooltip>
  );
}
