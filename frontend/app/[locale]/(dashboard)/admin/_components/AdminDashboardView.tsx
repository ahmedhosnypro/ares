"use client";

import { Box, Grid } from "@mui/material";
import { RecentSummaryItem } from "../types";
import StatCardGrid, { SummaryItem } from "./StatCardGrid";
import RevenueChart from "./RevenueChart";
import QuickActions from "./QuickActions";
import TopVehicles from "./TopVehicles";
import RecentBookings, { BookingListItem } from "./RecentBookings";
import LiveActivity from "./LiveActivity";
import { QuickAction, TopVehicle } from "./mockData";
import { logger } from "@/utils/logger";

export interface AdminDashboardViewProps {
  readonly summary: readonly SummaryItem[];
  readonly recentBookings: readonly BookingListItem[];
  readonly activities: readonly RecentSummaryItem[];
  readonly topVehicles: readonly TopVehicle[];
  readonly quickActions: readonly QuickAction[];
  readonly rawSummaryData?: unknown;
}

export default function AdminDashboardView({
  summary,
  recentBookings,
  activities,
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
          <RevenueChart />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <RecentBookings bookings={recentBookings} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8, md: 7 }}>
          <TopVehicles vehicles={topVehicles} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, md: 5 }}>
          <QuickActions actions={quickActions} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <LiveActivity activities={activities} />
        </Grid>
      </Grid>
    </Box>
  );
}
