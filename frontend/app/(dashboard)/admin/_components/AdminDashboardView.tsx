"use client";

import React from "react";
import { Box, Typography, Grid, Stack } from "@mui/material";
import { DashboardSummary, RecentSummaryItem } from "../types";
import StatCardGrid, { SummaryItem } from "./StatCardGrid";
import RevenueChart from "./RevenueChart";
import QuickActions from "./QuickActions";
import TopVehicles from "./TopVehicles";
import RecentBookingsTable, { BookingListItem } from "./RecentBookingsTable";
import AlertsCenter from "./AlertsCenter";
import LiveActivity from "./LiveActivity";
import {
  RevenueDataPoint,
  QuickAction,
  TopVehicle,
  DashboardAlert,
  DashboardActivity
} from "./mockData";

export interface AdminDashboardViewProps {
  summary: SummaryItem[];
  recentBookings: BookingListItem[];
  alerts: DashboardAlert[];
  activities: RecentSummaryItem[];
  revenueData: RevenueDataPoint[];
  topVehicles: TopVehicle[];
  quickActions: QuickAction[];
  firstName?: string;
  rawSummaryData?: any;
}

export default function AdminDashboardView({
  summary,
  recentBookings,
  alerts,
  activities,
  revenueData,
  quickActions,
  topVehicles,
  firstName,
  rawSummaryData
}: AdminDashboardViewProps) {
  
  // Log the raw data from the API to the browser console for debugging
  console.log("🔥 Raw Dashboard API Data from Backend:", rawSummaryData);
  console.log("🔥 Mapped Summary Cards Data:", summary);

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
