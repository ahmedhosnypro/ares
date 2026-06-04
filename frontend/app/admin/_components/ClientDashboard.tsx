"use client";

import { Box, Grid, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import WelcomeHeader from "./WelcomeHeader";
import StatsGrid from "./StatsGrid";
import RevenueChart from "./RevenueChart";
import RecentBookingsTable from "./RecentBookingsTable";
import UpcomingBookings from "./UpcomingBookings";
import QuickActions from "./QuickActions";
import ActivityFeed from "./ActivityFeed";
import SystemStatusCard from "./SystemStatusCard";

interface DashboardProps {
  summary: any;
  recentBookings: any[];
  upcomingBookings: any[];
  activities: any[];
  revenueData: { date: string; revenue: number }[];
  userFirstName?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function ClientDashboard({
  summary,
  recentBookings,
  upcomingBookings,
  activities,
  revenueData,
  userFirstName,
}: DashboardProps) {
  const theme = useTheme();

  // Prepare stats for grid
  const stats = [
    {
      title: "Total Bookings",
      value: summary.totalBookings.toLocaleString(),
      change: "+12.5%",
      isUp: true,
      icon: "EventAvailable",
      color: "primary",
    },
    {
      title: "Active Vehicles",
      value: summary.totalVehicles.toLocaleString(),
      change: "+4.2%",
      isUp: true,
      icon: "DirectionsCar",
      color: "success",
    },
    {
      title: "Total Revenue",
      value: `$${summary.totalRevenue.toLocaleString()}`,
      change: "+18.2%",
      isUp: true,
      icon: "AttachMoney",
      color: "warning",
    },
    {
      title: "Total Users",
      value: summary.totalUsers.toLocaleString(),
      change: "-2.1%",
      isUp: false,
      icon: "PeopleAlt",
      color: "error",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <WelcomeHeader userName={userFirstName} />

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <StatsGrid stats={stats} />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <RevenueChart data={revenueData} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <QuickActions />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <RecentBookingsTable bookings={recentBookings} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <UpcomingBookings bookings={upcomingBookings} />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <ActivityFeed activities={activities} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SystemStatusCard />
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}