"use client";

/**
 * Supplier Earnings — live data wiring.
 *
 * Same layout, primitives and spacing as the original scaffolding pass;
 * only the data flow changed:
 *
 *   - 4 stat cards          ← GET /api/supplier/earnings/stats
 *   - Monthly revenue chart ← GET /api/supplier/earnings/chart
 *   - Top vehicles list     ← GET /api/supplier/earnings/top-vehicles
 *
 * Auth uses NextAuth's `useSession()` (same pattern as the supplier
 * dashboard). Every fetch is ownership-scoped server-side by the
 * supplier's user id, so the frontend just renders what the backend
 * returns.
 *
 * Visual language matches `app/(dashboard)/supplier/dashboard/SupplierDashboardClient.tsx`
 * intentionally — same Card/Avatar/Skeleton primitives and Recharts
 * styling, so the earnings page feels like a natural sibling of the
 * dashboard.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSession } from "next-auth/react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DirectionsCarFilledTwoToneIcon from "@mui/icons-material/DirectionsCarFilledTwoTone";
import VehicleStats, { type StatItem } from "@/app/(dashboard)/_components/VehicleStats";
import {
  getSupplierEarningsChart,
  getSupplierEarningsStats,
  getSupplierTopVehicles,
  type MonthlyRevenuePoint,
  type SupplierEarningsStats,
  type SupplierTopVehicle,
} from "@/api-clients/supplier-earnings/supplier-earnings";
import { logger } from "@/utils/logger";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format an integer count with thousand separators. */
function formatCount(value: number): string {
  return Number.isFinite(value) ? Math.trunc(value).toLocaleString() : "0";
}

/**
 * Format a money amount. Whole-dollar values hide decimals to keep the
 * stat cards uncluttered — same convention as the supplier dashboard.
 */
function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Defensive coercion — backend can in theory send null/undefined. */
function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SupplierEarningsClient() {
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession();

  // Year selector for the chart. Defaults to the current UTC year and
  // can be switched to one of the previous four years; covers the
  // common "how did I do this year vs last year" use case without
  // adding a full date-range picker.
  const currentYear = useMemo(() => new Date().getUTCFullYear(), []);
  const yearOptions = useMemo(() => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3], [currentYear]);
  const [year, setYear] = useState<number>(currentYear);

  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<SupplierEarningsStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // ── Chart state ────────────────────────────────────────────────────────────
  const [chart, setChart] = useState<MonthlyRevenuePoint[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // ── Top vehicles state ─────────────────────────────────────────────────────
  const [topVehicles, setTopVehicles] = useState<SupplierTopVehicle[] | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  const accessToken = session?.accessToken;

  // ── Fetch: stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setStatsLoading(false);
      setStatsError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setStatsLoading(true);
    setStatsError(null);

    void (async () => {
      try {
        const data = await getSupplierEarningsStats(accessToken);
        if (!abortState.cancelled) setStats(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load supplier earnings stats", err);
        setStatsError("Could not load your earnings stats. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  // ── Fetch: top vehicles (lifetime — does not depend on year selector) ──────
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setTopLoading(false);
      setTopError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setTopLoading(true);
    setTopError(null);

    void (async () => {
      try {
        const data = await getSupplierTopVehicles(accessToken);
        if (!abortState.cancelled) setTopVehicles(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load supplier top vehicles", err);
        setTopError("Could not load your top vehicles. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setTopLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  // ── Fetch: chart (re-fetches when the year selector changes) ───────────────
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setChartLoading(false);
      setChartError("You must be signed in to view earnings.");
      return;
    }

    const abortState = { cancelled: false };
    setChartLoading(true);
    setChartError(null);

    void (async () => {
      try {
        const data = await getSupplierEarningsChart(accessToken, year);
        if (!abortState.cancelled) setChart(data);
      } catch (err) {
        if (abortState.cancelled) return;
        logger.error("Failed to load supplier earnings chart", err);
        setChartError("Could not load the monthly chart. Please try again shortly.");
      } finally {
        if (!abortState.cancelled) setChartLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, year]);

  // ── Derived: stat card items ───────────────────────────────────────────────
  const earningsStatsItems = useMemo<readonly StatItem[]>(
    () => [
      {
        label: "Total Earnings",
        value: stats ? formatCurrency(safeNum(stats.totalEarnings)) : "—",
        subtitle: "Lifetime, completed bookings",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
      {
        label: "This Month",
        value: stats ? formatCurrency(safeNum(stats.thisMonthRevenue)) : "—",
        subtitle: "Revenue this calendar month",
        icon: <CalendarMonthIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: "Last Month",
        value: stats ? formatCurrency(safeNum(stats.lastMonthRevenue)) : "—",
        subtitle: "Revenue previous calendar month",
        icon: <HistoryIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: "Completed Bookings",
        value: stats ? formatCount(safeNum(stats.completedBookingsCount)) : "—",
        subtitle: "Lifetime, completed only",
        icon: <EventAvailableIcon fontSize="medium" />,
        color: "warning",
      },
    ],
    [stats]
  );

  // ── Derived: does the chart contain any non-zero revenue? ──────────────────
  // Used to swap between the real BarChart and an empty-state hint, so
  // suppliers who haven't completed any bookings yet don't see a flat axis.
  const hasChartData = useMemo(() => Boolean(chart && chart.some(p => safeNum(p.revenue) > 0)), [chart]);

  const handleYearChange = useCallback((next: number) => {
    setYear(next);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
          Earnings Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track your revenue, monthly trend, and top performing vehicles. Figures are scoped to your account and
          aggregated from completed bookings only.
        </Typography>
      </Box>

      {/* ── Stat cards row ───────────────────────────────────────────── */}
      {statsError && (
        <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
          {statsError}
        </Alert>
      )}
      <VehicleStats items={earningsStatsItems} loading={statsLoading} sx={{ mb: 3 }} />

      {/* ── Chart + Top vehicles row ─────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Monthly revenue chart */}
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
                </Box>
                <Select
                  size="small"
                  value={year}
                  onChange={e => {
                    handleYearChange(e.target.value);
                  }}
                  inputProps={{ "aria-label": "Year selector" }}
                  sx={{
                    minWidth: 96,
                    "& .MuiSelect-select": { fontWeight: 600, py: 0.75 },
                  }}
                  disabled={chartLoading}
                >
                  {yearOptions.map(y => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {chartError ? (
                <Alert severity="error" variant="outlined" sx={{ height: 280, display: "flex", alignItems: "center" }}>
                  {chartError}
                </Alert>
              ) : chartLoading ? (
                <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 2 }} />
              ) : !hasChartData ? (
                // Empty-state — same dashed frame the scaffold used so the
                // page doesn't reflow once the supplier has revenue.
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
                    No revenue recorded for {year} yet.
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Completed bookings will appear here once your customers return their vehicles.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", height: 280, minWidth: 0, position: "relative", overflow: "hidden" }}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height={280} minWidth={0}>
                      <BarChart data={chart ?? []} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => formatCurrency(value)}
                          width={68}
                        />
                        <Tooltip
                          cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
                          contentStyle={{
                            borderRadius: 8,
                            border: `1px solid ${theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            boxShadow: theme.shadows[3],
                          }}
                          formatter={(value: unknown) => [formatCurrency(Number(value)), "Revenue"]}
                        />
                        <Bar
                          dataKey="revenue"
                          name="Revenue"
                          fill={theme.palette.primary.main}
                          radius={[8, 8, 0, 0]}
                          maxBarSize={42}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              )}
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

              {topError ? (
                <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>
                  {topError}
                </Alert>
              ) : topLoading ? (
                <TopVehiclesSkeleton />
              ) : topVehicles && topVehicles.length > 0 ? (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {topVehicles.map((v, idx) => (
                    <TopVehicleRow key={v.vehicleId} vehicle={v} rank={idx + 1} />
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    py: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    textAlign: "center",
                  }}
                >
                  <EmojiEventsIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No completed bookings yet.
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 280 }}>
                    Once your vehicles start completing rentals, the top performers will rank here.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

/**
 * One row in the Top Vehicles leaderboard. Kept inline since it's only
 * used here and the layout is highly specific to this card.
 */
function TopVehicleRow({ vehicle, rank }: { readonly vehicle: SupplierTopVehicle; readonly rank: number }) {
  const theme = useTheme();
  const name = [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim() || "Unnamed vehicle";
  const hasImage = vehicle.imageUrl && vehicle.imageUrl.trim().length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
      }}
    >
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
        {rank}
      </Avatar>

      <Avatar
        variant="rounded"
        src={hasImage ? vehicle.imageUrl : undefined}
        alt={name}
        sx={{
          width: 48,
          height: 48,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
          borderRadius: 2,
        }}
      >
        {!hasImage && <DirectionsCarFilledTwoToneIcon />}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {formatCount(vehicle.completedBookingsCount)} {vehicle.completedBookingsCount === 1 ? "booking" : "bookings"}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {formatCurrency(vehicle.totalEarnings)}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
          earnings
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Loading state for the top vehicles list. Renders five skeleton rows so
 * the card height matches the loaded state (no layout shift).
 */
function TopVehiclesSkeleton() {
  const theme = useTheme();
  const slots = [0, 1, 2, 3, 4];
  return (
    <Stack divider={<Divider flexItem />} spacing={0}>
      {slots.map(idx => (
        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
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
          <Skeleton variant="rounded" width={48} height={48} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="70%" sx={{ fontSize: "0.95rem", lineHeight: 1.2 }} />
            <Skeleton variant="text" width="40%" sx={{ fontSize: "0.75rem", lineHeight: 1.2, mt: 0.25 }} />
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Skeleton variant="text" width={72} sx={{ fontSize: "0.95rem", lineHeight: 1.2 }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
              earnings
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
