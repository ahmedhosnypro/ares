"use client";

import { useSession } from "next-auth/react";
import { Box, Container, Grid, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// Nested components
import DashboardHeader from "./_components/DashboardHeader";
import ActiveAssignmentCard from "./_components/ActiveAssignmentCard";
import KpiMetricsGrid from "./_components/KpiMetricsGrid";
import UpcomingSchedule from "./_components/UpcomingSchedule";
import PayoutLogsTable from "./_components/PayoutLogsTable";

// API services and fallback mocks
import {
  getDriverActiveAssignment,
  getDriverUpcomingSchedule,
  getDriverPayoutLogs,
  getDriverDashboardSummary,
  mockAssignment,
  mockUpcomingTrips,
  mockPayoutHistory,
  mockDashboardSummary,
  type TripAssignment,
  type UpcomingTrip,
  type HistoricalPayout,
  type DriverKpiMetrics,
  type DriverAvailabilityStatus,
} from "@/api-clients/driver-dashboard/driver-dashboard";

export default function DriverDashboardClient() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard.driverDashboard");

  // State hooks initialized with the Mock fallback data for immediate seamless rendering
  const [assignment, setAssignment] = useState<TripAssignment>(mockAssignment);
  const [upcomingTrips, setUpcomingTrips] = useState<readonly UpcomingTrip[]>(mockUpcomingTrips);
  const [payoutHistory, setPayoutHistory] = useState<readonly HistoricalPayout[]>(mockPayoutHistory);
  const [kpiMetrics, setKpiMetrics] = useState<DriverKpiMetrics>({
    earnings: `$${mockDashboardSummary.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    tripsCompleted: mockDashboardSummary.totalTripsCompleted,
    activeUpcomingCount: mockDashboardSummary.upcomingAssignmentsCount,
    rating: `${mockDashboardSummary.averageRating.toFixed(1)} / 5.0`,
  });
  const [availability, setAvailability] = useState<DriverAvailabilityStatus>(mockDashboardSummary.availability);

  // Fetch real API data when token is ready, with automatic error fallback
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    async function loadDashboardData(t: string) {
      const activeTask = getDriverActiveAssignment(t).then(data => {
        setAssignment(data);
      });
      const upcomingTask = getDriverUpcomingSchedule(t).then(data => {
        setUpcomingTrips(data);
      });
      const payoutsTask = getDriverPayoutLogs(t).then(data => {
        setPayoutHistory(data);
      });

      const summaryTask = getDriverDashboardSummary(t).then(summary => {
        setAvailability(summary.availability);
        setKpiMetrics({
          earnings: `$${summary.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          tripsCompleted: summary.totalTripsCompleted,
          activeUpcomingCount: summary.upcomingAssignmentsCount,
          rating: `${summary.averageRating.toFixed(1)} / 5.0`,
        });
      });

      await Promise.allSettled([activeTask, upcomingTask, payoutsTask, summaryTask]);
    }

    void loadDashboardData(token);
  }, [session]);

  const handleAvailabilityChange = (newAvailability: string) => {
    setAvailability(newAvailability as DriverAvailabilityStatus);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        {/* Header Panel */}
        <DashboardHeader
          userName={session?.user.firstName || "Chauffeur"}
          initialAvailability={availability}
          onAvailabilityChange={handleAvailabilityChange}
        />

        {/* KPI Metrics Strip */}
        <Box sx={{ mb: { xs: 4, md: 5 } }}>
          <KpiMetricsGrid
            earnings={kpiMetrics.earnings}
            tripsCompleted={kpiMetrics.tripsCompleted}
            activeUpcomingCount={kpiMetrics.activeUpcomingCount}
            rating={kpiMetrics.rating}
          />
        </Box>

        {/* Split Grid Section with Increased Spacing */}
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* Prominent Active Assignment Card (8 Columns) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <ActiveAssignmentCard assignment={assignment} />
          </Grid>

          {/* Secondary Calendar & Shift Schedule (4 Columns) */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex", flexDirection: "column" }}>
            <UpcomingSchedule trips={upcomingTrips} />
          </Grid>
        </Grid>

        {/* Tab Selection Heading & Logs Table */}
        <Box sx={{ mt: 4, mb: 2, borderBottom: "1px solid", borderColor: "border.light" }}>
          <Box sx={{ pb: 1.5, display: "inline-block", borderBottom: "2px solid", borderColor: "primary.main" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
              {t("historicalPayoutLogs")}
            </Typography>
          </Box>
        </Box>

        <PayoutLogsTable payouts={payoutHistory} />
      </Container>
    </Box>
  );
}
