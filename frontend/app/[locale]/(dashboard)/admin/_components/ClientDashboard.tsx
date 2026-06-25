"use client";

import { Box, Grid } from "@mui/material";
import { motion } from "framer-motion";

export default function ClientDashboard() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* <WelcomeHeader userName={userFirstName} /> */}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* <StatsGrid stats={stats} /> */}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>{/* <RevenueChart data={revenueData} /> */}</Grid>
          <Grid size={{ xs: 12, lg: 4 }}>{/* <QuickActions /> */}</Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }}>{/* <RecentBookingsTable bookings={recentBookings} /> */}</Grid>
          <Grid size={{ xs: 12, lg: 5 }}>{/* <UpcomingBookings bookings={upcomingBookings} /> */}</Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, lg: 6 }}>{/* <ActivityFeed activities={activities} /> */}</Grid>
          <Grid size={{ xs: 12, lg: 6 }}>{/* <SystemStatusCard /> */}</Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}
