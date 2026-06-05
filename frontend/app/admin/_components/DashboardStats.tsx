"use client";

import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Box, Typography, Avatar, Chip, CircularProgress, useTheme } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface SummaryStat {
  readonly title: string;
  readonly value: string;
  readonly change: string;
  readonly isUp: boolean;
  readonly icon: React.ReactNode;
  readonly color: "primary" | "success" | "warning" | "error";
}

interface DashboardSummary {
  readonly totalBookings: number;
  readonly totalVehicles: number;
  readonly totalRevenue: number;
  readonly totalUsers: number;
}

export default function DashboardStats() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { data: session, status } = useSession();
  const [summaryData, setSummaryData] = useState<readonly SummaryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    const fetchDashboardData = async () => {
      try {
        if (session?.accessToken) {
          const data = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
            accessToken: session.accessToken,
          });
          setSummaryData([
            {
              title: "Total Bookings",
              value: data.totalBookings.toString(),
              change: "+12.5%",
              isUp: true,
              icon: <EventAvailableIcon />,
              color: "primary",
            },
            {
              title: "Active Vehicles",
              value: data.totalVehicles.toString(),
              change: "+4.2%",
              isUp: true,
              icon: <DirectionsCarIcon />,
              color: "success",
            },
            {
              title: "Total Revenue",
              value: `$${data.totalRevenue.toLocaleString()}`,
              change: "+18.2%",
              isUp: true,
              icon: <AttachMoneyIcon />,
              color: "warning",
            },
            {
              title: "Total Users",
              value: data.totalUsers.toString(),
              change: "-2.1%",
              isUp: false,
              icon: <PeopleAltIcon />,
              color: "error",
            },
          ]);
        }
      } catch (error) {
        logger.error("Failed to fetch dashboard summary", error);
        setSummaryData([
          {
            title: "Total Bookings",
            value: "1,284",
            change: "+12.5%",
            isUp: true,
            icon: <EventAvailableIcon />,
            color: "primary",
          },
          {
            title: "Active Vehicles",
            value: "342",
            change: "+4.2%",
            isUp: true,
            icon: <DirectionsCarIcon />,
            color: "success",
          },
          {
            title: "Total Revenue",
            value: "$45,231",
            change: "+18.2%",
            isUp: true,
            icon: <AttachMoneyIcon />,
            color: "warning",
          },
          { title: "Total Users", value: "892", change: "-2.1%", isUp: false, icon: <PeopleAltIcon />, color: "error" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    void fetchDashboardData();
  }, [session?.accessToken, status]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {summaryData.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "16px",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: theme.palette.shadow.card,
              transition: "all 0.2s",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <CardContent sx={{ p: "24px !important" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: isDark ? `${stat.color}.dark` : `${stat.color}.light`,
                    color: isDark ? "common.white" : `${stat.color}.dark`,
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Chip
                  icon={
                    stat.isUp ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />
                  }
                  label={stat.change}
                  size="small"
                  color={stat.isUp ? "success" : "error"}
                  variant={isDark ? "filled" : "outlined"}
                  sx={{ fontWeight: "bold", borderRadius: "8px" }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: "text.primary" }}>
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
