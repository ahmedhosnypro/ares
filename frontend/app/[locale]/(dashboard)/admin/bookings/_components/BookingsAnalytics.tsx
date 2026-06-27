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

  // Ensure strict ordering and map colors for the Donut Chart
  const statusOrder = [
    "Draft",
    "Payment Pending",
    "Confirmed",
    "Active",
    "Completed",
    "Cancelled",
    "Cancelled By Admin",
  ];

  const getColorForStatus = (status: string) => {
    switch (status) {
      case "Draft":
        return theme.palette.text.disabled;
      case "Payment Pending":
        return theme.palette.status.pending.main;
      case "Confirmed":
        return theme.palette.status.confirmed.main;
      case "Active":
        return theme.palette.status.active.main;
      case "Completed":
        return theme.palette.status.completed.main;
      case "Cancelled":
        return theme.palette.status.cancelled.main;
      case "Cancelled By Admin":
        return theme.palette.status.blocked.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Draft":
        return t("analytics.statuses.draft");
      case "Payment Pending":
        return t("analytics.statuses.paymentPending");
      case "Confirmed":
        return t("analytics.statuses.confirmed");
      case "Active":
        return t("analytics.statuses.active");
      case "Completed":
        return t("analytics.statuses.completed");
      case "Cancelled":
        return t("analytics.statuses.cancelled");
      case "Cancelled By Admin":
        return t("analytics.statuses.cancelledByAdmin");
      default:
        return status;
    }
  };

  const chartData = statusOrder.map(status => {
    const found = analytics?.statusDistribution.find(s => s.status === status);
    return {
      name: getStatusLabel(status),
      value: found ? found.count : 0,
      color: getColorForStatus(status),
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
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {t("analytics.title")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexGrow: 1 }}>
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, ml: 2, flexGrow: 1 }}>
                {chartData.map((entry, index) => (
                  <Stack key={index} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
                      {entry.name}: {entry.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* KPI Cards */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Grid container spacing={1.5} sx={{ height: "100%", alignContent: "flex-start" }}>
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
