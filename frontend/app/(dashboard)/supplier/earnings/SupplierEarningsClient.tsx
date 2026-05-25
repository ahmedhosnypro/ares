"use client";

/**
 * Supplier Earnings — UI scaffolding.
 *
 * Structural placeholder only. Every visible value is an em-dash ("—")
 * or a static skeleton; no API calls, no state, no derived data. The
 * goal is to lock in the layout and visual language now (cards,
 * spacing, chart frame, list rows) so the follow-up data-wiring
 * iteration is a focused "drop the data in" change rather than a
 * full UI build.
 *
 * Backend endpoints that this view will eventually consume:
 *   - GET /api/supplier/earnings/stats         → 4 stat cards
 *   - GET /api/supplier/earnings/chart         → monthly revenue chart
 *   - GET /api/supplier/earnings/top-vehicles  → top 5 vehicles list
 *
 * Visual language matches `app/supplier/dashboard/SupplierDashboardClient.tsx`
 * intentionally — same Card/Avatar/Skeleton primitives and spacing so the
 * earnings page feels like a natural sibling of the dashboard. Nothing
 * about the existing supplier dashboard, vehicles, or bookings flows is
 * touched.
 */

import { useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Skeleton,
  Chip,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DirectionsCarFilledTwoToneIcon from "@mui/icons-material/DirectionsCarFilledTwoTone";
import VehicleStats, { type StatItem } from "@/app/(dashboard)/_components/VehicleStats";

// ── Stat card config ─────────────────────────────────────────────────────────
// Titles + icons only. Values are deliberately left blank — the data-wiring
// pass will fill them in via the `stats` endpoint.



// Five empty rows for the "top performing vehicles" leaderboard. Pure
// placeholder skeletons — no demo data, no make/model strings.
const TOP_VEHICLE_SLOTS = [0, 1, 2, 3, 4] as const;

// "Scaffolding only" pill that mirrors the visual language of the supplier
// dashboard's `DemoDataBadge`, but with text that makes the placeholder
// status unambiguous. Kept inline (not a shared component) since this is
// the only place it's used right now.
function ScaffoldingBadge() {
  const theme = useTheme();
  return (
    <Chip
      label="Scaffolding"
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        color: "warning.main",
        borderRadius: 1.5,
        height: 22,
      }}
    />
  );
}

export default function SupplierEarningsClient() {
  const theme = useTheme();

  const earningsStatsItems = useMemo<readonly StatItem[]>(() => [
    {
      label: "Total Earnings",
      value: "—",
      subtitle: "Lifetime, completed bookings",
      icon: <AttachMoneyIcon fontSize="medium" />,
      color: "success",
    },
    {
      label: "This Month",
      value: "—",
      subtitle: "Revenue this calendar month",
      icon: <CalendarMonthIcon fontSize="medium" />,
      color: "primary",
    },
    {
      label: "Last Month",
      value: "—",
      subtitle: "Revenue previous calendar month",
      icon: <HistoryIcon fontSize="medium" />,
      color: "info",
    },
    {
      label: "Completed Bookings",
      value: "—",
      subtitle: "Lifetime, completed only",
      icon: <EventAvailableIcon fontSize="medium" />,
      color: "warning",
    },
  ], []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
            Earnings Dashboard
          </Typography>
          <ScaffoldingBadge />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track your revenue, monthly trend, and top performing vehicles. UI scaffolding only — live data wiring is
          coming in a follow-up.
        </Typography>
      </Box>

      <VehicleStats items={earningsStatsItems} loading={true} sx={{ mb: 3 }} />

      {/* ── Chart frame + Top vehicles ────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Monthly revenue chart frame */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.5,
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <BarChartIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Monthly Revenue
                  </Typography>
                  <ScaffoldingBadge />
                </Box>
                <Skeleton
                  variant="rectangular"
                  width={90}
                  height={28}
                  animation={false}
                  sx={{ borderRadius: 1.5 }}
                  aria-label="Year selector placeholder"
                />
              </Box>

              {/* Empty chart frame — no recharts yet. A bordered box keeps
                  the layout dimensions stable so the page doesn't reflow
                  when the chart is added. */}
              <Box
                sx={{
                  width: "100%",
                  height: 280,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <BarChartIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Monthly revenue chart will render here.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  12 bars (Jan – Dec) once the chart endpoint is wired in.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top vehicles list */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <EmojiEventsIcon sx={{ color: "warning.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Top Performing Vehicles
                  </Typography>
                  <ScaffoldingBadge />
                </Box>
                <Chip
                  label="Top 5"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                    color: "warning.main",
                  }}
                />
              </Box>

              <Stack divider={<Divider flexItem />} spacing={0}>
                {TOP_VEHICLE_SLOTS.map(idx => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      py: 1.5,
                    }}
                  >
                    {/* Rank chip */}
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(theme.palette.warning.main, 0.12),
                        color: "warning.main",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                      }}
                    >
                      {idx + 1}
                    </Avatar>

                    {/* Vehicle thumb placeholder */}
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                        borderRadius: 2,
                      }}
                    >
                      <DirectionsCarFilledTwoToneIcon />
                    </Avatar>

                    {/* Name + count */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Skeleton
                        variant="text"
                        width="70%"
                        sx={{ fontSize: "0.95rem", lineHeight: 1.2 }}
                        animation={false}
                        aria-label={`Vehicle ${(idx + 1).toString()} name placeholder`}
                      />
                      <Skeleton
                        variant="text"
                        width="40%"
                        sx={{ fontSize: "0.75rem", lineHeight: 1.2, mt: 0.25 }}
                        animation={false}
                        aria-label={`Vehicle ${(idx + 1).toString()} bookings placeholder`}
                      />
                    </Box>

                    {/* Earnings */}
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Skeleton
                        variant="text"
                        width={72}
                        sx={{ fontSize: "0.95rem", lineHeight: 1.2 }}
                        animation={false}
                        aria-label={`Vehicle ${(idx + 1).toString()} earnings placeholder`}
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                        earnings
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
