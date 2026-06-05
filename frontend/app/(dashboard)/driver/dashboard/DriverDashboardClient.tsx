"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Box, CircularProgress, Container, Typography, Alert, Button, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Route as TripsIcon,
  AttachMoney as EarningsIcon,
  Star as StarIcon,
  LocalShipping as ActiveTripsIcon,
} from "@mui/icons-material";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import DriverAvailabilityToggle from "../_components/DriverAvailabilityToggle";
import StatCard from "../../_components/StatCard";
import Link from "next/link";

interface DashboardSummary {
  status: string;
  availability: "Available" | "Unavailable" | "Reserved";
  isActive: boolean;
  totalTripsCompleted: number;
  averageRating: number;
  totalEarnings: number;
  activeRequestsCount: number;
  upcomingAssignmentsCount: number;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  upcomingTrips: number;
}

export default function DriverDashboardClient() {
  const { data: session } = useSession();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  const fetchSummary = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(toApiUrl("/api/driver/dashboard/summary"), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load dashboard summary");

      const data = await res.json();
      setSummary(data);
    } catch (err) {
      logger.error("Error fetching driver dashboard summary", err);
      setError("Could not load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
  }, [session]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: "text.primary", mb: 1 }}>
            Driver Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {session?.user?.firstName}! Here is your overview.
          </Typography>
        </Box>

        {summary && (
          <Box sx={{ bgcolor: "background.paper", p: 2, borderRadius: 3, boxShadow: theme.palette.shadow.card }}>
            <DriverAvailabilityToggle
              initialAvailability={summary.availability}
              onAvailabilityChange={newAvail => {
                setSummary(prev => (prev ? { ...prev, availability: newAvail as any } : null));
              }}
            />
          </Box>
        )}
      </Box>

      {summary?.activeRequestsCount ? (
        <Alert
          severity="info"
          sx={{ mb: 4, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" component={Link} href="/driver/requests">
              View Requests
            </Button>
          }
        >
          You have <strong>{summary.activeRequestsCount}</strong> new ride request
          {summary.activeRequestsCount > 1 ? "s" : ""} available in your area!
        </Alert>
      ) : null}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Earnings"
            value={`$${summary?.totalEarnings.toFixed(2) ?? "0.00"}`}
            icon={<EarningsIcon />}
            trend={{ value: 0, label: "All time" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed Trips"
            value={summary?.completedTrips.toString() ?? "0"}
            icon={<TripsIcon />}
            trend={{ value: 0, label: "Total trips completed" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active/Upcoming"
            value={((summary?.activeTrips || 0) + (summary?.upcomingTrips || 0)).toString()}
            icon={<ActiveTripsIcon />}
            trend={{ value: 0, label: "Trips in progress or upcoming" }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Average Rating"
            value={summary?.averageRating ? summary.averageRating.toFixed(1) : "No ratings"}
            icon={<StarIcon sx={{ color: "warning.main" }} />}
            trend={{ value: 0, label: "Based on customer reviews" }}
          />
        </Grid>
      </Grid>

      {/* Recent Activity or Upcoming Trips can be added here if needed */}
    </Container>
  );
}
