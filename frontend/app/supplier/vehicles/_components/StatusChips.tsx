"use client";

/**
 * Small shared helpers used by both the list and the details pages.
 *
 * Keeps the status / availability colouring in one place so the supplier
 * portal stays visually consistent and we don't duplicate the
 * "what colour is Pending?" logic across pages.
 */

import { Chip, alpha, useTheme } from "@mui/material";

type StatusKey = "pending" | "approved" | "rejected" | "deleted" | "default";
type AvailabilityKey = "available" | "unavailable" | "fullybooked" | "default";

function statusKey(status: string | null | undefined): StatusKey {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "approved" || s === "active") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "deleted") return "deleted";
  return "default";
}

function availabilityKey(av: string | null | undefined): AvailabilityKey {
  const s = (av ?? "").toLowerCase();
  if (s === "available") return "available";
  if (s === "unavailable") return "unavailable";
  if (s === "fullybooked") return "fullybooked";
  return "default";
}

export function StatusChip({ status }: { readonly status: string | null | undefined }) {
  const theme = useTheme();
  const palette = {
    pending: theme.palette.warning.main,
    approved: theme.palette.success.main,
    rejected: theme.palette.error.main,
    deleted: theme.palette.text.disabled,
    default: theme.palette.text.secondary,
  } as const;
  const colour = palette[statusKey(status)];
  const label = status?.trim() ? status : "Unknown";

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        borderRadius: 2,
        fontWeight: 700,
        fontSize: 11,
        textTransform: "capitalize",
        bgcolor: alpha(colour, 0.15),
        color: colour,
      }}
    />
  );
}

export function AvailabilityChip({ availability }: { readonly availability: string | null | undefined }) {
  const theme = useTheme();
  const palette = {
    available: theme.palette.success.main,
    unavailable: theme.palette.text.secondary,
    fullybooked: theme.palette.warning.main,
    default: theme.palette.text.secondary,
  } as const;
  const colour = palette[availabilityKey(availability)];
  const label = availability?.trim() ? availability : "Unknown";

  return (
    <Chip
      size="small"
      label={label}
      variant="outlined"
      sx={{
        borderRadius: 2,
        fontWeight: 600,
        fontSize: 11,
        textTransform: "capitalize",
        borderColor: alpha(colour, 0.5),
        color: colour,
      }}
    />
  );
}
