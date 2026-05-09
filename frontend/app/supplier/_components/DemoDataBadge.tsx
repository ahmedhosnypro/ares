"use client";

import { Chip, Tooltip, alpha, useTheme } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";

interface DemoDataBadgeProps {
  /** Optional override label. Defaults to "Demo Data". */
  readonly label?: string;
  /** Optional explanation shown on hover. */
  readonly tooltip?: string;
}

/**
 * Subtle "Demo Data" indicator used across the supplier dashboard while we
 * surface mocked / placeholder analytics. It is intentionally low-contrast so
 * it doesn't compete with real metrics — just enough to make the source clear.
 */
export default function DemoDataBadge({
  label = "Demo Data",
  tooltip = "Showing placeholder data — will be replaced with live metrics once available.",
}: DemoDataBadgeProps) {
  const theme = useTheme();

  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Chip
        icon={<ScienceIcon sx={{ fontSize: 14 }} />}
        label={label}
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
