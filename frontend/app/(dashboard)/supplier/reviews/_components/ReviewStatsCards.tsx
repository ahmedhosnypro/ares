"use client";

/**
 * Statistics cards for the supplier reviews page.
 *
 * Visual language matches the rest of the supplier portal — same Card,
 * Avatar, Skeleton, hover-elevation, and the existing
 * `theme.palette.shadow.card` / `cardHover` tokens already used on the
 * supplier dashboard.
 */

import { Avatar, Box, Card, CardContent, Grid, Skeleton, Typography, alpha, useTheme } from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import type { SupplierReviewStatistics } from "@/api-clients/supplier-reviews/supplier-reviews";

type StatColor = "primary" | "success" | "warning" | "info";

interface StatConfig {
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly color: StatColor;
  readonly value: (s: SupplierReviewStatistics) => string;
  readonly subtitle: string;
}

const STAT_CONFIG: readonly StatConfig[] = [
  {
    title: "Average Rating",
    icon: <StarRoundedIcon fontSize="medium" />,
    color: "warning",
    value: s => (Number.isFinite(s.averageRating) ? s.averageRating.toFixed(2) : "0.00"),
    subtitle: "Across all your vehicles",
  },
  {
    title: "Total Reviews",
    icon: <RateReviewRoundedIcon fontSize="medium" />,
    color: "primary",
    value: s => Math.max(0, Math.trunc(s.totalReviews || 0)).toLocaleString(),
    subtitle: "Lifetime customer reviews",
  },
  {
    title: "5-Star Reviews",
    icon: <EmojiEventsRoundedIcon fontSize="medium" />,
    color: "success",
    value: s => Math.max(0, Math.trunc(s.fiveStarReviews || 0)).toLocaleString(),
    subtitle: "Top-rated bookings",
  },
  {
    title: "Pending Replies",
    icon: <HourglassTopRoundedIcon fontSize="medium" />,
    color: "info",
    value: s => Math.max(0, Math.trunc(s.pendingReplies || 0)).toLocaleString(),
    subtitle: "Reviews awaiting your reply",
  },
];

export interface ReviewStatsCardsProps {
  readonly stats: SupplierReviewStatistics | null;
  readonly loading: boolean;
}

export default function ReviewStatsCards({ stats, loading }: ReviewStatsCardsProps) {
  const theme = useTheme();

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {STAT_CONFIG.map(stat => {
        const value = stats ? stat.value(stats) : "—";
        return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: theme.palette.shadow.card,
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: theme.palette.shadow.cardHover,
                },
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette[stat.color].main, 0.12),
                      color: `${stat.color}.main`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, fontSize: "0.85rem", mb: 0.25 }}
                      noWrap
                    >
                      {stat.title}
                    </Typography>
                    {loading ? (
                      <Skeleton
                        variant="text"
                        width="60%"
                        sx={{ fontSize: "2.125rem", lineHeight: 1.1 }}
                        aria-label={`Loading ${stat.title}`}
                      />
                    ) : (
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.1 }}
                        noWrap
                      >
                        {value}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25, fontWeight: 500 }}
                    >
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
