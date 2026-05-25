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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSession } from "next-auth/react";
import DemoDataBadge from "../_components/DemoDataBadge";
import {
  getSupplierDashboardStats,
  type SupplierDashboardStats,
} from "@/api-clients/supplier-dashboard/supplier-dashboard";
import { logger } from "@/utils/logger";
import VehicleStats, { type StatItem } from "@/app/(dashboard)/_components/VehicleStats";

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
  message: string;
  time: string;
}

interface PendingAction {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "info" | "error";
  actionLabel: string;
}

// ── Demo data ────────────────────────────────────────────────────────────────
// All values below are hard-coded placeholders for the v1 dashboard. They will
// be replaced with real per-supplier metrics in a future iteration.

const DEMO_EARNINGS = [
  { month: "Jan", earnings: 1820 },
  { month: "Feb", earnings: 2410 },
  { month: "Mar", earnings: 2150 },
  { month: "Apr", earnings: 3080 },
  { month: "May", earnings: 2740 },
  { month: "Jun", earnings: 3520 },
  { month: "Jul", earnings: 4180 },
  { month: "Aug", earnings: 3960 },
];

const DEMO_BOOKINGS_BY_STATUS = [
  { status: "Active", count: 4 },
  { status: "Confirmed", count: 7 },
  { status: "Pending", count: 3 },
  { status: "Completed", count: 18 },
  { status: "Cancelled", count: 2 },
];

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "booking", message: "New booking received for Toyota Corolla 2024", time: "12 min ago" },
  { id: "a2", type: "payment", message: "Payout of $1,240 has been processed", time: "2 hr ago" },
  { id: "a3", type: "vehicle", message: "Hyundai Elantra listing approved by admin", time: "5 hr ago" },
  { id: "a4", type: "booking", message: "Booking #BK-2031 marked as completed", time: "Yesterday" },
  { id: "a5", type: "user", message: "Customer left a 5-star review on Kia Sportage", time: "Yesterday" },
];

const DEMO_PENDING_ACTIONS: PendingAction[] = [
  {
    id: "p1",
    title: "2 vehicles awaiting admin approval",
    description: "Newly added vehicles are pending review before going live.",
    severity: "warning",
    actionLabel: "Review",
  },
  {
    id: "p2",
    title: "1 booking needs confirmation",
    description: "A customer is waiting for you to confirm their pickup details.",
    severity: "error",
    actionLabel: "Confirm",
  },
  {
    id: "p3",
    title: "Complete your supplier profile",
    description: "Add your bank details to start receiving payouts automatically.",
    severity: "info",
    actionLabel: "Complete",
  },
];

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

// ── Number formatting helpers ────────────────────────────────────────────────

function formatCount(value: number): string {
  return Number.isFinite(value) ? Math.trunc(value).toLocaleString() : "0";
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  // Hide decimals for whole-dollar values to keep cards uncluttered, mirror
  // the admin dashboard's currency rendering style.
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SupplierDashboardClient() {
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession();

  // ── Live stats state ──────────────────────────────────────────────────────
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    let cancelled = false;

    const initStats = async () => {
      const accessToken = session?.accessToken;
      if (!accessToken) {
        setStatsLoading(false);
        setStatsError("You must be signed in to view dashboard stats.");
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      try {
        const data = await getSupplierDashboardStats(accessToken);
        if (cancelled) return;
        setStats(data);
      } catch (err: unknown) {
        if (cancelled) return;
        logger.error("Failed to load supplier dashboard stats", err);
        setStatsError("Could not load your dashboard stats. Please try again shortly.");
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
  }, [session?.accessToken, sessionStatus]);

  // Defensive coercion — backend can in theory send null/undefined for any
  // field; we never want the cards to render `NaN` or crash on `.toLocaleString`.
  const safeNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  const summaryData = useMemo<StatItem[]>(
    () => [
      {
        label: "Total Vehicles",
        value: stats ? formatCount(safeNum(stats.totalVehicles)) : "—",
        icon: <DirectionsCarIcon fontSize="medium" />,
        color: "primary",
      },
      {
        label: "Pending Vehicles",
        value: stats ? formatCount(safeNum(stats.pendingVehicles)) : "—",
        icon: <HourglassTopIcon fontSize="medium" />,
        color: "warning",
      },
      {
        label: "Active Bookings",
        value: stats ? formatCount(safeNum(stats.activeBookings)) : "—",
        icon: <EventAvailableIcon fontSize="medium" />,
        color: "info",
      },
      {
        label: "Total Earnings",
        value: stats ? formatCurrency(safeNum(stats.totalEarnings)) : "—",
        icon: <AttachMoneyIcon fontSize="medium" />,
        color: "success",
      },
    ],
    [stats]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      {/* Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Welcome back{session?.user.firstName ? `, ${session.user.firstName}` : ""}. Here&apos;s a snapshot of your
          fleet&apos;s performance.
        </Typography>
      </Box>

      {/* ── Inline stats error banner ───────────────────────────────────── */}
      {statsError && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          {statsError}
        </Alert>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* ── Stats cards (live data) ───────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <VehicleStats items={summaryData} loading={statsLoading} sx={{ mb: 3 }} />
        </motion.div>

        {/* ── Analytics charts row ──────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
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
                        Earnings Overview
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DEMO_EARNINGS} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
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
                          formatter={(value: unknown) => [`$${(value as number).toLocaleString()}`, "Earnings"]}
                          contentStyle={{
                            borderRadius: 8,
                            border: `1px solid ${theme.palette.divider}`,
                            background: theme.palette.background.paper,
                            boxShadow: theme.shadows[3],
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2.5}
                          fill="url(#supplierEarningsFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
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
                        Bookings by Status
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DEMO_BOOKINGS_BY_STATUS} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
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
                        <Bar dataKey="count" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} maxBarSize={42} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* ── Recent activity & Pending actions row ─────────────────────── */}
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
                        Recent Activity
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Stack divider={<Divider flexItem />} spacing={0}>
                    {DEMO_ACTIVITY.map(item => {
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
                              {item.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              {item.time}
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
                        Pending Actions
                      </Typography>
                      <DemoDataBadge />
                    </Box>
                    <Chip
                      label={DEMO_PENDING_ACTIONS.length.toString()}
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                  </Box>

                  <Stack spacing={1.5}>
                    {DEMO_PENDING_ACTIONS.map(action => {
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
                              {action.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              {action.description}
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
                            {action.actionLabel}
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
