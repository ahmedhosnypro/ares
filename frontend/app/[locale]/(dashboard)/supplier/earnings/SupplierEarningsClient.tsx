"use client";

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
import { useTranslations } from "next-intl";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BarChartIcon from "@mui/icons-material/BarChart";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DirectionsCarFilledTwoToneIcon from "@mui/icons-material/DirectionsCarFilledTwoTone";
import VehicleStats, { type StatItem } from "@/app/[locale]/(dashboard)/_components/VehicleStats";
import {
  getSupplierEarningsChart,
  getSupplierEarningsStats,
  getSupplierTopVehicles,
  type MonthlyRevenuePoint,
  type SupplierEarningsStats,
  type SupplierTopVehicle,
} from "@/api-clients/supplier-earnings/supplier-earnings";
import { logger } from "@/utils/logger";

function formatCount(value: number): string {
  return Number.isFinite(value) ? Math.trunc(value).toLocaleString() : "0";
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default function SupplierEarningsClient() {
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations("dashboard.supplierEarnings");

  const currentYear = useMemo(() => new Date().getUTCFullYear(), []);
  const yearOptions = useMemo(() => [currentYear, currentYear - 1, currentYear - 2, currentYear - 3], [currentYear]);
  const [year, setYear] = useState<number>(currentYear);

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

  const [chart, setChart] = useState<MonthlyRevenuePoint[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const [topVehicles, setTopVehicles] = useState<SupplierTopVehicle[] | null>(null);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState<string | null>(null);

  const accessToken = session?.accessToken;

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setStatsLoading(false);
      setStatsError(t("errors.notSignedIn"));
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
        setStatsError(t("errors.loadStatsFailed"));
      } finally {
        if (!abortState.cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, t]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setTopLoading(false);
      setTopError(t("errors.notSignedIn"));
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
        setTopError(t("errors.loadTopVehiclesFailed"));
      } finally {
        if (!abortState.cancelled) setTopLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, t]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setChartLoading(false);
      setChartError(t("errors.notSignedIn"));
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
        setChartError(t("errors.loadChartFailed"));
      } finally {
        if (!abortState.cancelled) setChartLoading(false);
      }
    })();

    return () => {
      abortState.cancelled = true;
    };
  }, [accessToken, sessionStatus, year, t]);

  const earningsStatsItems = useMemo<readonly StatItem[]>(
    () => [
      {
        label: t("stats.totalEarnings"),
        value: stats ? formatCurrency(safeNum(stats.totalEarnings)) : "—",
        subtitle: t("stats.totalEarningsSubtitle"),
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
      {
        label: t("stats.thisMonth"),
        value: stats ? formatCurrency(safeNum(stats.thisMonthRevenue)) : "—",
        subtitle: t("stats.thisMonthSubtitle"),
        icon: <CalendarMonthIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: t("stats.lastMonth"),
        value: stats ? formatCurrency(safeNum(stats.lastMonthRevenue)) : "—",
        subtitle: t("stats.lastMonthSubtitle"),
        icon: <HistoryIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: t("stats.completedBookings"),
        value: stats ? formatCount(safeNum(stats.completedBookingsCount)) : "—",
        subtitle: t("stats.completedBookingsSubtitle"),
        icon: <EventAvailableIcon fontSize="medium" />,
        color: "warning",
      },
    ],
    [stats, t]
  );

  const hasChartData = useMemo(() => Boolean(chart && chart.some(p => safeNum(p.revenue) > 0)), [chart]);

  const handleYearChange = useCallback((next: number) => {
    setYear(next);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.4px" }}>
          {t("heading")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("subtitle")}
        </Typography>
      </Box>

      {statsError && (
        <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
          {statsError}
        </Alert>
      )}
      <VehicleStats items={earningsStatsItems} loading={statsLoading} sx={{ mb: 3 }} />

      <Grid container spacing={3}>
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
                    {t("chart.monthlyRevenue")}
                  </Typography>
                </Box>
                <Select
                  size="small"
                  value={year}
                  onChange={e => {
                    handleYearChange(e.target.value);
                  }}
                  inputProps={{ "aria-label": t("chart.yearSelectorAriaLabel") }}
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
                    {t("chart.noRevenueRecorded", { year })}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t("chart.completedBookingsWillAppear")}
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
                          formatter={(value: unknown) => [formatCurrency(Number(value)), t("chart.revenue")]}
                        />
                        <Bar
                          dataKey="revenue"
                          name={t("chart.revenueBarName")}
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
                    {t("topVehicles.heading")}
                  </Typography>
                </Box>
                <Chip
                  label={t("topVehicles.top5")}
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
                <TopVehiclesSkeleton t={t} />
              ) : topVehicles && topVehicles.length > 0 ? (
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {topVehicles.map((v, idx) => (
                    <TopVehicleRow key={v.vehicleId} vehicle={v} rank={idx + 1} t={t} />
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
                    {t("topVehicles.noCompletedBookings")}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 280 }}>
                    {t("topVehicles.topPerformersWillAppear")}
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

function TopVehicleRow({
  vehicle,
  rank,
  t,
}: {
  readonly vehicle: SupplierTopVehicle;
  readonly rank: number;
  readonly t: ReturnType<typeof useTranslations<"dashboard.supplierEarnings">>;
}) {
  const theme = useTheme();
  const name = [vehicle.make, vehicle.model].filter(Boolean).join(" ").trim() || t("topVehicles.unnamedVehicle");
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
          {formatCount(vehicle.completedBookingsCount)}{" "}
          {vehicle.completedBookingsCount === 1 ? t("topVehicles.booking") : t("topVehicles.bookings")}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {formatCurrency(vehicle.totalEarnings)}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
          {t("topVehicles.earnings")}
        </Typography>
      </Box>
    </Box>
  );
}

function TopVehiclesSkeleton({
  t,
}: {
  readonly t: ReturnType<typeof useTranslations<"dashboard.supplierEarnings">>;
}) {
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
              {t("topVehicles.earnings")}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
