"use client";

/**
 * Read-only star rating used inside the supplier reviews table and modals.
 *
 * Kept intentionally minimal — accepts a 0–5 rating and renders five
 * filled/empty icons. Avoids pulling MUI's `Rating` component since
 * the supplier portal only ever needs a static display, not an input.
 */

import { Box, Typography, useTheme } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";

export interface RatingStarsProps {
  readonly rating: number;
  readonly size?: "small" | "medium" | "large";
  readonly showValue?: boolean;
}

const SIZE_PX: Record<NonNullable<RatingStarsProps["size"]>, number> = {
  small: 16,
  medium: 20,
  large: 28,
};

export default function RatingStars({ rating, size = "small", showValue = false }: RatingStarsProps) {
  const theme = useTheme();
  const normalized = Math.max(0, Math.min(5, Math.round(rating)));
  const px = SIZE_PX[size];

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ display: "inline-flex", color: theme.palette.warning.main, lineHeight: 0 }}>
        {[1, 2, 3, 4, 5].map(i =>
          i <= normalized ? (
            <StarRoundedIcon key={i} sx={{ fontSize: px }} />
          ) : (
            <StarOutlineRoundedIcon key={i} sx={{ fontSize: px, color: "text.disabled" }} />
          )
        )}
      </Box>
      {showValue && (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "text.primary", ml: 0.5, fontSize: size === "large" ? "1rem" : "0.85rem" }}
        >
          {normalized.toFixed(0)}
        </Typography>
      )}
    </Box>
  );
}
