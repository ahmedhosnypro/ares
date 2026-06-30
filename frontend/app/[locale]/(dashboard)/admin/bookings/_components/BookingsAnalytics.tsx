"use client";

import { Box, Typography, Paper, Grid, Stack, CircularProgress, useTheme } from "@mui/material";
// eslint-disable-next-line sonarjs/deprecation
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  PlayCircleTwoTone as ActiveIcon,
  LocalShippingTwoTone as PickupIcon,
  AssignmentReturnTwoTone as ReturnIcon,
  ScheduleTwoTone as UpcomingIcon,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import type { AdminBookingAnalytics } from "@/api-clients/bookings/bookings";
import { StatCard } from "@/app/[locale]/(dashboard)/_components/VehicleStats";

interface BookingsAnalyticsProps {
  readonly analytics: AdminBookingAnalytics | null;
  readonly loading: boolean;
}

export default function BookingsAnalytics({ analytics, loading }: BookingsAnalyticsProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.bookings");

  // Group booking statuses into UI categories for the Donut Chart
  const uiGroups = [
    {
      name: t("analytics.statuses.pending"),
      statuses: ["Draft", "Payment Pending", "PaymentPending"],
      color: theme.palette.status.pending.main,
    },
    {
      name: t("analytics.statuses.scheduled"),
      statuses: ["Confirmed"],
      color: theme.palette.status.confirmed.main,
    },
    {
      name: t("analytics.statuses.active"),
      statuses: ["Active"],
      color: theme.palette.status.active.main,
    },
    {
      name: t("analytics.statuses.completed"),
      statuses: ["Completed"],
      color: theme.palette.status.completed.main,
    },
    {
      name: t("analytics.statuses.cancelled"),
      statuses: ["Cancelled", "Cancelled By Admin", "CancelledByAdmin", "Expired"],
      color: theme.palette.status.cancelled.main,
    },
  ];

  const chartData = uiGroups.map(group => {
    const value = group.statuses.reduce((sum, status) => {
      const found = analytics?.statusDistribution.find(s => s.status === status);
      return sum + (found ? found.count : 0);
    }, 0);

    return {
      name: group.name,
      value,
      color: group.color,
    };
  });

  const totalBookings = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const kpis = [
    {
      label: t("analytics.kpis.activeBookings"),
      value: analytics?.activeBookings ?? 0,
      color: "success",
      icon: <ActiveIcon />,
    },
    {
      label: t("analytics.kpis.pickupQueue"),
      value: analytics?.pickupQueue ?? 0,
      color: "warning",
      icon: <PickupIcon />,
    },
    {
      label: t("analytics.kpis.returnQueue"),
      value: analytics?.returnQueue ?? 0,
      color: "info",
      icon: <ReturnIcon />,
    },
    {
      label: t("analytics.kpis.upcomingPickups"),
      value: analytics?.upcomingPickups ?? 0,
      color: "primary",
      icon: <UpcomingIcon />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {/* Donut Chart Card */}
        <Grid size={{ xs: 12, lg: 5, xl: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              height: { xs: "auto", lg: "100%" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {t("analytics.title")}
            </Typography>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={3}
              sx={{ alignItems: "center", justifyContent: "center", flexGrow: 1 }}
            >
              {/* Donut Chart Wrapper */}
              <Box sx={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        /* eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation */
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) => [String(value), t("analytics.chartTooltip")]}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: theme.shadows[3] }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                    {t("analytics.total")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
                    {totalBookings}
                  </Typography>
                </Box>
              </Box>

              {/* Legend alongside the chart */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "row", lg: "column" },
                  flexWrap: "wrap",
                  gap: 1.5,
                  ml: { xs: 0, lg: 2 },
                  mt: { xs: 1, lg: 0 },
                  flexGrow: 1,
                  justifyContent: "center",
                }}
              >
                {chartData.map((entry, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {entry.name}: {entry.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* KPI Cards */}
        <Grid size={{ xs: 12, lg: 7, xl: 8 }}>
          <Grid container spacing={1.5} sx={{ height: { xs: "auto", lg: "100%" }, alignContent: "flex-start" }}>
            {kpis.map((kpi, index) => (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <StatCard label={kpi.label} value={kpi.value} color={kpi.color} icon={kpi.icon} loading={loading} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
