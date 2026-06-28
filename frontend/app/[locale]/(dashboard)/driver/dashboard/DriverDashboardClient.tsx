"use client";

import { useSession } from "next-auth/react";
import { Box, CircularProgress, Container, Grid, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import DashboardHeader from "./_components/DashboardHeader";
import ActiveAssignmentCard from "./_components/ActiveAssignmentCard";
import KpiMetricsGrid from "./_components/KpiMetricsGrid";
import UpcomingSchedule from "./_components/UpcomingSchedule";
import PayoutLogsTable from "./_components/PayoutLogsTable";

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
import { getDriverEarningsStats } from "@/api-clients/driver-earnings/driver-earnings";

const DEFAULT_KPI: DriverKpiMetrics = {
  earnings: "$0.00",
  tripsCompleted: 0,
  activeUpcomingCount: 0,
  rating: "0.0 / 5.0",
};

export default function DriverDashboardClient() {
  const { data: session } = useSession();
  const t = useTranslations("dashboard.driverDashboard");
  const locale = useLocale();

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [locale]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<TripAssignment | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<readonly UpcomingTrip[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<readonly HistoricalPayout[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<DriverKpiMetrics>(DEFAULT_KPI);
  const [availability, setAvailability] = useState<DriverAvailabilityStatus>("Unavailable");

  const loadDashboardData = useCallback(
    async (accessToken: string) => {
      setIsLoading(true);
      try {
        const [activeData, upcomingData, payoutsData, summaryData] = await Promise.allSettled([
          getDriverActiveAssignment(accessToken),
          getDriverUpcomingSchedule(accessToken),
          getDriverPayoutLogs(accessToken),
          getDriverDashboardSummary(accessToken),
        ]);

        if (activeData.status === "fulfilled") setAssignment(activeData.value);
        if (upcomingData.status === "fulfilled") setUpcomingTrips(upcomingData.value);
        if (payoutsData.status === "fulfilled") setPayoutHistory(payoutsData.value);

        if (summaryData.status === "fulfilled" && summaryData.value) {
          const summary = summaryData.value;
          setAvailability(summary.availability);
          setKpiMetrics({
            earnings: formatCurrency(summary.totalEarnings),
            tripsCompleted: summary.totalTripsCompleted,
            activeUpcomingCount: summary.upcomingAssignmentsCount,
            rating: t("kpiMetrics.ratingFormat", { value: summary.averageRating.toFixed(1) }),
          });
        }

        const earningsStats = await getDriverEarningsStats(accessToken);
        setKpiMetrics(prev => ({
          ...prev,
          availableBalance: formatCurrency(earningsStats.availableBalance),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [formatCurrency, t]
  );

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;
    void loadDashboardData(token);
  }, [session, loadDashboardData]);

  const handleAvailabilityChange = (newAvailability: string) => {
    setAvailability(newAvailability as DriverAvailabilityStatus);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        <DashboardHeader
          userName={session?.user.firstName || t("chauffeur")}
          initialAvailability={availability}
          onAvailabilityChange={handleAvailabilityChange}
        />

        <Box sx={{ mb: { xs: 4, md: 5 } }}>
          <KpiMetricsGrid
            earnings={kpiMetrics.earnings}
            tripsCompleted={kpiMetrics.tripsCompleted}
            activeUpcomingCount={kpiMetrics.activeUpcomingCount}
            rating={kpiMetrics.rating}
            availableBalance={kpiMetrics.availableBalance}
          />
        </Box>

        <Grid container spacing={{ xs: 4, md: 5 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ActiveAssignmentCard assignment={assignment} />
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: "flex", flexDirection: "column" }}>
            <UpcomingSchedule trips={upcomingTrips} />
          </Grid>
        </Grid>

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
