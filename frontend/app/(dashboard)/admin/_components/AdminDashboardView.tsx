"use client";

import React from "react";
import { Box, Typography, Grid, Stack } from "@mui/material";
import { DashboardSummary } from "../types";
import StatCardGrid, { SummaryItem } from "./StatCardGrid";
import RevenueChart from "./RevenueChart";
import VehicleStatusChart from "./VehicleStatusChart";
import QuickActions from "./QuickActions";
import TopVehicles from "./TopVehicles";
import RecentBookingsTable, { BookingListItem } from "./RecentBookingsTable";
import AlertsCenter from "./AlertsCenter";
import LiveActivity from "./LiveActivity";
import {
  RevenueDataPoint,
  VehicleStatusData,
  QuickAction,
  TopVehicle,
  DashboardAlert,
  DashboardActivity
} from "./mockData";

export interface AdminDashboardViewProps {
  summary: SummaryItem[];
  recentBookings: BookingListItem[];
  alerts: DashboardAlert[];
  activities: DashboardActivity[];
  revenueData: RevenueDataPoint[];
  vehicleStatusData: VehicleStatusData[];
  quickActions: QuickAction[];
  topVehicles: TopVehicle[];
  firstName?: string;
}

export default function AdminDashboardView({
  summary,
  recentBookings,
  alerts,
  activities,
  revenueData,
  vehicleStatusData,
  quickActions,
  topVehicles,
  firstName
}: AdminDashboardViewProps) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit", minHeight: "100vh" }}>


      <StatCardGrid items={summary} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8, sm: 7 }}>
          <RevenueChart data={revenueData} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4, sm: 5 }}>
          <VehicleStatusChart data={vehicleStatusData} />
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
