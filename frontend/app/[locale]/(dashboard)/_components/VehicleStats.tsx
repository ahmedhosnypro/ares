"use client";

import React, { memo } from "react";
import { useSession } from "next-auth/react";
import { useAdminVehicleStats } from "@/api-clients/cars/hooks";
import {
  Card,
  Box,
  Stack,
  Avatar,
  Typography,
  useTheme,
  alpha,
  Skeleton,
  type SxProps,
  type Theme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AssessmentTwoTone as InventoryIcon,
  CheckCircleTwoTone as AvailableIcon,
  KeyTwoTone as RentalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";

// ── STAT CARD ──
export interface StatCardProps {
  readonly label: string;
  readonly value: number | string;
  readonly color: string;
  readonly icon: React.ReactNode;
  readonly change?: string;
  readonly isUp?: boolean;
  readonly loading?: boolean;
  readonly subtitle?: string;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  color,
  icon,
  change,
  isUp,
  loading,
  subtitle,
}: StatCardProps) {
  const theme = useTheme();

  // Resolve palette colors safely (e.g. "primary" or dynamic colors from theme)
  const isPaletteColor = color in theme.palette;
  const mainColor = isPaletteColor
    ? (theme.palette[color as keyof typeof theme.palette] as { main: string }).main
    : color;

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mainColor, 0.08)} 100%)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(mainColor, 0.18)}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -18,
          right: -18,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: alpha(mainColor, 0.1),
        }}
      />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, width: 40, height: 40 }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton
              variant="text"
              width="60%"
              sx={{ fontSize: { xs: "1.6rem", sm: "2.125rem" }, lineHeight: 1.1, bgcolor: alpha(mainColor, 0.15) }}
              aria-label={`Loading ${label}`}
            />
          ) : (
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: mainColor, lineHeight: 1.1, fontSize: { xs: "1.6rem", sm: "2.125rem" } }}
              noWrap
            >
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {change !== undefined && isUp !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
          {isUp ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: isUp ? "success.main" : "error.main",
              fontSize: "0.78rem",
            }}
          >
            {change}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
            from last month
          </Typography>
        </Box>
      )}
    </Card>
  );
});

export interface StatItem {
  readonly label: string;
  readonly value: number | string;
  readonly color: string;
  readonly icon: React.ReactNode;
  readonly change?: string;
  readonly isUp?: boolean;
  readonly loading?: boolean;
  readonly subtitle?: string;
}

export interface VehicleStatsProps {
  // Option 1: Individual values for vehicle stats
  readonly total?: number;
  readonly availableCount?: number;
  readonly rentalCount?: number;

  // Option 2: Full custom list of stats cards (e.g. for suppliers, users, locations)
  readonly items?: readonly StatItem[];

  // Single card label, color, and icon overrides
  readonly totalLabel?: string;
  readonly availableLabel?: string;
  readonly rentalLabel?: string;
  readonly totalColor?: string;
  readonly availableColor?: string;
  readonly rentalColor?: string;
  readonly totalIcon?: React.ReactNode;
  readonly availableIcon?: React.ReactNode;
  readonly rentalIcon?: React.ReactNode;

  // Layout & Customization
  readonly layout?: "row" | "column";
  readonly sx?: SxProps<Theme>;
  readonly loading?: boolean;
}

export default function VehicleStats({
  total,
  availableCount,
  rentalCount,
  items,
  totalLabel = "Total Assets",
  availableLabel = "Available",
  rentalLabel = "On Rental",
  totalColor,
  availableColor,
  rentalColor,
  totalIcon = <InventoryIcon fontSize="small" />,
  availableIcon = <AvailableIcon fontSize="small" />,
  rentalIcon = <RentalIcon fontSize="small" />,
  layout = "row",
  sx,
  loading = false,
}: VehicleStatsProps) {
  const theme = useTheme();
  const { data: session } = useSession();

  // Determine standard colors from theme if not overridden
  const resolvedTotalColor = totalColor ?? theme.palette.primary.main;
  const resolvedAvailableColor = availableColor ?? theme.palette.success.main;
  const resolvedRentalColor = rentalColor ?? theme.palette.warning.main;

  // Standard vehicle stats API fetch fallback
  const shouldFetchStats = total === undefined && !items;
  const { stats: vehicleStats } = useAdminVehicleStats(shouldFetchStats ? session?.accessToken : undefined);

  // Compile final items list to render
  const finalItems: readonly StatItem[] = items ?? [
    {
      label: totalLabel,
      value: total ?? vehicleStats?.totalVehicles ?? 0,
      color: resolvedTotalColor,
      icon: totalIcon,
    },
    {
      label: availableLabel,
      value: availableCount ?? vehicleStats?.availableVehicles ?? 0,
      color: resolvedAvailableColor,
      icon: availableIcon,
    },
    {
      label: rentalLabel,
      value: rentalCount ?? vehicleStats?.onRentalVehicles ?? 0,
      color: resolvedRentalColor,
      icon: rentalIcon,
    },
  ];

  // Grid layout size determination
  let gridSizes;
  if (layout === "column") {
    gridSizes = { xs: 12 };
  } else if (finalItems.length === 2) {
    gridSizes = { xs: 12, sm: 6 };
  } else if (finalItems.length === 4) {
    gridSizes = { xs: 12, sm: 6, md: 6, lg: 3 };
  } else if (finalItems.length === 6) {
    gridSizes = { xs: 12, sm: 4, lg: 2 };
  } else {
    gridSizes = { xs: 12, sm: 4 };
  }

  // Combine standard sx with prop-passed sx in a type-safe array of objects/functions
  const combinedSx = (sx ? [{ mb: 4 }, sx] : [{ mb: 4 }]) as SxProps<Theme>;

  return (
    <Grid container spacing={2} sx={combinedSx}>
      {finalItems.map((item, index) => (
        <Grid size={gridSizes} key={index}>
          <StatCard
            label={item.label}
            value={item.value}
            color={item.color}
            icon={item.icon}
            change={item.change}
            isUp={item.isUp}
            loading={item.loading ?? loading}
            subtitle={item.subtitle}
          />
        </Grid>
      ))}
    </Grid>
  );
}
