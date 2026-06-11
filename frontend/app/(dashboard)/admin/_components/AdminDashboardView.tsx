"use client";

import { Box, Grid } from "@mui/material";
import { RecentSummaryItem } from "../types";
import StatCardGrid, { SummaryItem } from "./StatCardGrid";
import RevenueChart from "./RevenueChart";
import QuickActions from "./QuickActions";
import TopVehicles from "./TopVehicles";
import { BookingListItem } from "./RecentBookingsTable";
import RecentBookings from "./RecentBookings";
import AlertsCenter from "./AlertsCenter";
import LiveActivity from "./LiveActivity";
import VehiclesPerCategoryCard from "./VehiclesPerCategoryCard";
import { QuickAction, TopVehicle, DashboardAlert } from "./mockData";
import { logger } from "@/utils/logger";
import { DashboardSummary } from "../types";

export interface AdminDashboardViewProps {
  readonly summary: readonly SummaryItem[];
  readonly recentBookings: readonly BookingListItem[];
  readonly alerts: readonly DashboardAlert[];
  readonly activities: readonly RecentSummaryItem[];
  readonly topVehicles: readonly TopVehicle[];
  readonly quickActions: readonly QuickAction[];
  readonly rawSummaryData?: unknown;
}

export default function AdminDashboardView({
  summary,
  alerts,
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
        <Grid size={{ xs: 12, lg: 12 }}>
          <RecentBookings />
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
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <VehiclesPerCategoryCard data={(rawSummaryData as DashboardSummary)?.vehiclesPerCategory} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AlertsCenter alerts={alerts} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <LiveActivity activities={activities} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
