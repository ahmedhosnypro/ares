"use client";

/**
 * Supplier Dashboard — first iteration.
 *
 * Visual language is intentionally aligned with `app/admin/AdminDashboardClient.tsx`
 * (cards, spacing, charts, motion).
 *
 * Stats cards are wired to the live backend endpoint
 * `GET /api/supplier/dashboard/stats` (see `api-clients/supplier-dashboard`).
 * Charts, recent activity, and pending actions still use demo data — those
 * sections remain clearly marked with a "Demo Data" badge until their
 * respective backend endpoints land.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Button,
  Divider,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { DirectionsCarFilledTwoTone as CarIcon } from "@mui/icons-material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  // eslint-disable-next-line sonarjs/deprecation
  Cell,
} from "recharts";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { toImageUrl } from "@/utils/image-url";
import DemoDataBadge from "../_components/DemoDataBadge";
import {
  getSupplierDashboardStats,
  getSupplierDashboardBookingsByStatus,
  getSupplierVehicleStatusDistribution,
  type SupplierDashboardStats,
} from "@/api-clients/supplier-dashboard/supplier-dashboard";
import {
  getSupplierEarningsChart,
  getSupplierTopVehicles,
  type MonthlyRevenuePoint,
  type SupplierTopVehicle,
} from "@/api-clients/supplier-earnings/supplier-earnings";
import { logger } from "@/utils/logger";
import VehicleStats, { type StatItem } from "@/app/[locale]/(dashboard)/_components/VehicleStats";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "user" | "vehicle";
  messageKey: string;
  timeKey: string;
}

interface PendingAction {
  id: string;
  titleKey: string;
  descriptionKey: string;
  severity: "warning" | "info" | "error";
  actionLabelKey: string;
}

const ACTIVITY_META: Record<
  ActivityItem["type"],
  { color: "primary" | "success" | "warning" | "info"; icon: React.ReactNode }
> = {
  booking: { color: "primary", icon: <EventAvailableOutlinedIcon fontSize="small" /> },
  payment: { color: "success", icon: <PaymentIcon fontSize="small" /> },
  user: { color: "info", icon: <PersonAddIcon fontSize="small" /> },
  vehicle: { color: "warning", icon: <DirectionsCarIcon fontSize="small" /> },
};

const ACTION_META: Record<PendingAction["severity"], { color: "warning" | "info" | "error"; icon: React.ReactNode }> = {
  warning: { color: "warning", icon: <HourglassTopIcon fontSize="small" /> },
  info: { color: "info", icon: <VerifiedOutlinedIcon fontSize="small" /> },
  error: { color: "error", icon: <PriorityHighIcon fontSize="small" /> },
};

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

const DEMO_ACTIVITY_ITEMS: { id: string; type: ActivityItem["type"]; messageKey: string; timeKey: string }[] = [
  { id: "a1", type: "booking", messageKey: "newBooking", timeKey: "minutesAgo" },
  { id: "a2", type: "payment", messageKey: "payoutProcessed", timeKey: "hoursAgo" },
  { id: "a3", type: "vehicle", messageKey: "listingApproved", timeKey: "fiveHoursAgo" },
  { id: "a4", type: "booking", messageKey: "bookingCompleted", timeKey: "yesterday" },
  { id: "a5", type: "user", messageKey: "customerReview", timeKey: "yesterday" },
];

const DEMO_PENDING_ACTION_ITEMS: {
  id: string;
  severity: PendingAction["severity"];
  titleKey: string;
  descriptionKey: string;
  actionLabelKey: string;
}[] = [
  {
    id: "p1",
    severity: "warning",
    titleKey: "vehiclesAwaitingApproval.title",
    descriptionKey: "vehiclesAwaitingApproval.description",
    actionLabelKey: "vehiclesAwaitingApproval.actionLabel",
  },
  {
    id: "p2",
    severity: "error",
    titleKey: "bookingNeedsConfirmation.title",
    descriptionKey: "bookingNeedsConfirmation.description",
    actionLabelKey: "bookingNeedsConfirmation.actionLabel",
  },
  {
    id: "p3",
    severity: "info",
    titleKey: "completeProfile.title",
    descriptionKey: "completeProfile.description",
    actionLabelKey: "completeProfile.actionLabel",
  },
];

export default function SupplierDashboardClient() {
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });
  const t = useTranslations("dashboard.supplierDashboard");

  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);
  const [earningsChartData, setEarningsChartData] = useState<MonthlyRevenuePoint[] | null>(null);
  const [bookingsChartRaw, setBookingsChartRaw] = useState<{
    pending: number;
    confirmed: number;
    active: number;
    completed: number;
    cancelled: number;
  } | null>(null);
  const [topVehicles, setTopVehicles] = useState<SupplierTopVehicle[] | null>(null);
  const [vehicleStatusChartData, setVehicleStatusChartData] = useState<
    { name: string; value: number; color: string }[] | null
  >(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated" && !session.user.roles.includes("Supplier")) {
      window.location.href = "/";
      return;
    }

    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [sessionStatus, session?.user.roles]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    let cancelled = false;

    const initStats = async () => {
      const accessToken = session.accessToken;
      if (!accessToken) {
        setStatsLoading(false);
        setStatsError(t("errors.notSignedIn"));
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      try {
        const [statsData, earningsData, bookingsData, topVehiclesData, vehicleStatusData] = await Promise.all([
          getSupplierDashboardStats(accessToken),
          getSupplierEarningsChart(accessToken),
          getSupplierDashboardBookingsByStatus(accessToken),
          getSupplierTopVehicles(accessToken, "bookings"),
          getSupplierVehicleStatusDistribution(accessToken),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setEarningsChartData(earningsData);
        setTopVehicles(topVehiclesData);
        setBookingsChartRaw(bookingsData);

        const statusColors: Record<string, string> = {
          Available: theme.palette.success.main,
          Booked: theme.palette.primary.main,
          Unavailable: theme.palette.primary.main,
          FullyBooked: theme.palette.primary.main,
          Maintenance: theme.palette.error.main,
          ComingSoon: theme.palette.info.main,
          Retired: theme.palette.text.disabled,
        };

        const chartData = Object.entries(vehicleStatusData).map(([status, count]) => ({
          name: status,
          value: count,
          color: statusColors[status] || theme.palette.grey[500],
        }));

        setVehicleStatusChartData(chartData);
      } catch (err: unknown) {
        if (cancelled) return;
        logger.error("Failed to load supplier dashboard stats", err);
        setStatsError(t("errors.loadFailed"));
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    void initStats();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, t, theme]);

  const bookingsChartData = useMemo(() => {
    if (!bookingsChartRaw) return null;
    return [
      { status: t("charts.bookingStatus.pending"), count: bookingsChartRaw.pending },
      { status: t("charts.bookingStatus.confirmed"), count: bookingsChartRaw.confirmed },
      { status: t("charts.bookingStatus.active"), count: bookingsChartRaw.active },
      { status: t("charts.bookingStatus.completed"), count: bookingsChartRaw.completed },
      { status: t("charts.bookingStatus.cancelled"), count: bookingsChartRaw.cancelled },
    ];
  }, [bookingsChartRaw, t]);

  const safeNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  const summaryData = useMemo<StatItem[]>(
    () => [
      {
        label: t("stats.totalVehicles"),
        value: stats ? formatCount(safeNum(stats.totalVehicles)) : "—",
        icon: <DirectionsCarIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: t("stats.pendingVehicles"),
        value: stats ? formatCount(safeNum(stats.pendingVehicles)) : "—",
        icon: <HourglassTopIcon fontSize="medium" />,
        color: "warning",
      },
      {
        label: t("stats.activeBookings"),
        value: stats ? formatCount(safeNum(stats.activeBookings)) : "—",
        icon: <EventAvailableIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: t("stats.totalEarnings"),
        value: stats ? formatCurrency(safeNum(stats.totalEarnings)) : "—",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
    ],
    [stats, t]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {t("greeting.welcomeBack")}
          {session?.user.firstName ? `, ${session.user.firstName}` : ""}. {t("greeting.fleetPerformance")}
        </Typography>
      </Box>

      {statsError && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          {statsError}
        </Alert>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <VehicleStats items={summaryData} loading={statsLoading} sx={{ mb: 3 }} />
        </motion.div>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <motion.div variants={itemVariants} style={{ height: "100%", width: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("charts.earningsOverview")}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: "100%", height: 280, minWidth: 0, position: "relative", overflow: "hidden" }}>
                    {mounted && earningsChartData && (
                      <ResponsiveContainer width="100%" height={280} minWidth={0}>
                        <AreaChart data={earningsChartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="supplierEarningsFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.45} />
                              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                            </linearGradient>
                          </defs>
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
                            tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip
                            formatter={(value: unknown) => [
                              `$${(value as number).toLocaleString()}`,
                              t("charts.earnings"),
                            ]}
                            contentStyle={{
                              borderRadius: 8,
                              border: `1px solid ${theme.palette.divider}`,
                              background: theme.palette.background.paper,
                              boxShadow: theme.shadows[3],
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={theme.palette.primary.main}
                            strokeWidth={2.5}
                            fill="url(#supplierEarningsFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <motion.div variants={itemVariants} style={{ height: "100%", width: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("charts.bookingsByStatus")}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: "100%", height: 280, minWidth: 0, position: "relative", overflow: "hidden" }}>
                    {mounted && bookingsChartData && (
                      <ResponsiveContainer width="100%" height={280} minWidth={0}>
                        <BarChart data={bookingsChartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                          <XAxis
                            dataKey="status"
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
                            contentStyle={{
                              borderRadius: 8,
                              border: `1px solid ${theme.palette.divider}`,
                              background: theme.palette.background.paper,
                              boxShadow: theme.shadows[3],
                            }}
                          />
                          <Bar
                            dataKey="count"
                            fill={theme.palette.primary.main}
                            radius={[8, 8, 0, 0]}
                            maxBarSize={42}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("topVehicles.heading")}
                      </Typography>
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {topVehicles?.map(vehicle => (
                      <Box
                        key={vehicle.vehicleId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          py: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            overflow: "hidden",
                            flexShrink: 0,
                            bgcolor: th => alpha(th.palette.primary.main, 0.08),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {vehicle.imageUrl ? (
                            <Image
                              src={(toImageUrl(vehicle.imageUrl) as string) || vehicle.imageUrl}
                              alt={`${vehicle.make} ${vehicle.model}`}
                              width={120}
                              height={90}
                              style={{ objectFit: "cover", width: "100%", height: "100%" }}
                            />
                          ) : (
                            <CarIcon fontSize="small" />
                          )}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                            {vehicle.make} {vehicle.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {formatCount(vehicle.completedBookingsCount)} {t("topVehicles.completedBookings")}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    {topVehicles?.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        {t("topVehicles.noCompletedBookings")}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("vehicleStatus.heading")}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: "100%", height: 280, minWidth: 0, position: "relative", overflow: "hidden" }}>
                    {mounted && vehicleStatusChartData && (
                      <ResponsiveContainer width="100%" height={280} minWidth={0}>
                        <PieChart>
                          <Pie
                            data={vehicleStatusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {vehicleStatusChartData.map((entry, index) => (
                              // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 8,
                              border: `1px solid ${theme.palette.divider}`,
                              background: theme.palette.background.paper,
                              boxShadow: theme.shadows[3],
                            }}
                            itemStyle={{
                              fontWeight: 600,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Box>

                  {mounted && vehicleStatusChartData && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mt: 1 }}>
                      {vehicleStatusChartData
                        .filter(v => v.value > 0)
                        .map((status, idx) => (
                          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: status.color }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {status.name} ({status.value})
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("recentActivity")}
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {DEMO_ACTIVITY_ITEMS.map(item => {
                      const meta = ACTIVITY_META[item.type];
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            py: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: alpha(theme.palette[meta.color].main, 0.12),
                              color: `${meta.color}.main`,
                            }}
                          >
                            {meta.icon}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                              {t(`demoActivity.${item.messageKey}`)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {t(`demoActivityTime.${item.timeKey}`)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t("pendingActions")}
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <Chip
                      label={DEMO_PENDING_ACTION_ITEMS.length.toString()}
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                  </Box>

                  <Stack spacing={1.5}>
                    {DEMO_PENDING_ACTION_ITEMS.map(action => {
                      const meta = ACTION_META[action.severity];
                      return (
                        <Box
                          key={action.id}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            p: 1.75,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: alpha(theme.palette[meta.color].main, 0.25),
                            bgcolor: alpha(theme.palette[meta.color].main, 0.05),
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: alpha(theme.palette[meta.color].main, 0.18),
                              color: `${meta.color}.main`,
                            }}
                          >
                            {meta.icon}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {t(`demoPendingActions.${action.titleKey}`)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              {t(`demoPendingActions.${action.descriptionKey}`)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color={meta.color}
                            endIcon={<ChevronRightIcon />}
                            disabled
                            sx={{
                              flexShrink: 0,
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: 2,
                            }}
                          >
                            {t(`demoPendingActions.${action.actionLabelKey}`)}
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}
