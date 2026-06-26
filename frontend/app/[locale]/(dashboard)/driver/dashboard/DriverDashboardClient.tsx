"use client";

import { useSession } from "next-auth/react";
import { Box, Container, Grid, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";

// Nested components
import DashboardHeader from "./_components/DashboardHeader";
import ActiveAssignmentCard from "./_components/ActiveAssignmentCard";
import KpiMetricsGrid from "./_components/KpiMetricsGrid";
import UpcomingSchedule from "./_components/UpcomingSchedule";
import PayoutLogsTable from "./_components/PayoutLogsTable";

// API services
import {
  getDriverActiveAssignment,
  getDriverUpcomingSchedule,
  getDriverPayoutLogs,
  getDriverDashboardSummary,
  type TripAssignment,
  type UpcomingTrip,
  type HistoricalPayout,
  type DriverKpiMetrics,
  type DriverAvailabilityStatus,
} from "@/api-clients/driver-dashboard/driver-dashboard";

const DEFAULT_KPI: DriverKpiMetrics = {
  earnings: "$0.00",
  tripsCompleted: 0,
  activeUpcomingCount: 0,
  rating: "0.0 / 5.0",
};

export default function DriverDashboardClient() {
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<TripAssignment | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<readonly UpcomingTrip[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<readonly HistoricalPayout[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<DriverKpiMetrics>(DEFAULT_KPI);
  const [availability, setAvailability] = useState<DriverAvailabilityStatus>("Unavailable");

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    async function loadDashboardData(t: string) {
      setIsLoading(true);
      try {
        const [activeData, upcomingData, payoutsData, summaryData] = await Promise.allSettled([
          getDriverActiveAssignment(t),
          getDriverUpcomingSchedule(t),
          getDriverPayoutLogs(t),
          getDriverDashboardSummary(t),
        ]);

        if (activeData.status === "fulfilled") setAssignment(activeData.value);
        if (upcomingData.status === "fulfilled") setUpcomingTrips(upcomingData.value);
        if (payoutsData.status === "fulfilled") setPayoutHistory(payoutsData.value);

        if (summaryData.status === "fulfilled" && summaryData.value) {
          const summary = summaryData.value;
          setAvailability(summary.availability);
          setKpiMetrics({
            earnings: `$${summary.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            tripsCompleted: summary.totalTripsCompleted,
            activeUpcomingCount: summary.upcomingAssignmentsCount,
            rating: `${summary.averageRating.toFixed(1)} / 5.0`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData(token);
  }, [session]);

  const handleAvailabilityChange = (newAvailability: string) => {
    setAvailability(newAvailability as DriverAvailabilityStatus);
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        {/* Header Panel */}
        <DashboardHeader
          userName={session?.user?.firstName ?? "Chauffeur"}
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

        {/* Split Grid Section */}
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {/* Active Assignment Card (8 Columns) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <ActiveAssignmentCard assignment={assignment} />
          </Grid>

          {/* Calendar & Shift Schedule (4 Columns) */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex", flexDirection: "column" }}>
            <UpcomingSchedule trips={upcomingTrips} />
          </Grid>
        </Grid>

        {/* Historical Payout Logs */}
        <Box sx={{ mt: 4, mb: 2, borderBottom: "1px solid", borderColor: "border.light" }}>
          <Box sx={{ pb: 1.5, display: "inline-block", borderBottom: "2px solid", borderColor: "primary.main" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main" }}>
              Historical Payout Logs
            </Typography>
          </Box>
        </Box>

        <PayoutLogsTable payouts={payoutHistory} />
      </Container>
    </Box>
  );
}
