"use client";

import { Box, Grid } from "@mui/material";
import { RecentSummaryItem } from "../types";
import StatCardGrid, { SummaryItem } from "./StatCardGrid";
import RevenueChart from "./RevenueChart";
import QuickActions from "./QuickActions";
import TopVehicles from "./TopVehicles";
import RecentBookingsTable, { BookingListItem } from "./RecentBookingsTable";
import AlertsCenter from "./AlertsCenter";
import LiveActivity from "./LiveActivity";
import { RevenueDataPoint, QuickAction, TopVehicle, DashboardAlert } from "./mockData";
import { logger } from "@/utils/logger";

export interface AdminDashboardViewProps {
  readonly summary: readonly SummaryItem[];
  readonly recentBookings: readonly BookingListItem[];
  readonly alerts: readonly DashboardAlert[];
  readonly activities: readonly RecentSummaryItem[];
  readonly revenueData: readonly RevenueDataPoint[];
  readonly topVehicles: readonly TopVehicle[];
  readonly quickActions: readonly QuickAction[];
  readonly rawSummaryData?: unknown;
}

export default function AdminDashboardView({
  summary,
  recentBookings,
  alerts,
  activities,
  revenueData,
  quickActions,
  topVehicles,
  rawSummaryData,
}: AdminDashboardViewProps) {
  // Log the raw data from the API to the browser console for debugging
  logger.info("🔥 Raw Dashboard API Data from Backend:", rawSummaryData);
  logger.info("🔥 Mapped Summary Cards Data:", summary);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit", minHeight: "100vh" }}>
      <StatCardGrid items={summary} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <RevenueChart data={revenueData} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <RecentBookingsTable bookings={recentBookings} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6, sm: 6 }}>
          <TopVehicles vehicles={topVehicles} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6, sm: 6 }}>
          <QuickActions actions={quickActions} />
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }} sx={{ mt: 5 }}>
        {/* الـ Grid ده بيشتغل كحاوية (Container) للعنصرين اللي جواه */}
        <Grid container spacing={3}>
          {/* المكون الأول */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <AlertsCenter alerts={alerts} />
          </Grid>

          {/* المكون الثاني */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <LiveActivity activities={activities} />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
