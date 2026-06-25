"use client";

import { useEffect, useState } from "react";
import { Grid, Card, CardContent, Box, Typography, Avatar, Chip, CircularProgress, useTheme } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { useAdminVehicleStats } from "@/api-clients/cars/cars";

interface DashboardSummary {
  activeBookings: number;
  pendingVerifications: number;
  availableVehicles: number;
  pendingInspections: number;
  totalUsers: number;
}

interface StatItem {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "error" | "info";
}

export default function DashboardStats() {
  const theme = useTheme(); // سحبنا الـ Theme عشان نعرف إحنا Dark ولا Light
  const isDark = theme.palette.mode === "dark";

  const { data: session, status } = useSession();
  const [summaryData, setSummaryData] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Still calling this in case we want to cross-reference or override available vehicles
  const { stats: vehicleStats } = useAdminVehicleStats(session?.accessToken);

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
              title: "Total Users",
              value: data.totalUsers.toString(),
              change: "+12.5%",
              isUp: true,
              icon: <PeopleAltIcon />,
              color: "primary",
            },
            {
              title: "Active Bookings",
              value: data.activeBookings.toString(),
              change: "+5.2%",
              isUp: true,
              icon: <TrendingUpIcon />,
              color: "success",
            },
            {
              title: "Pending Verifications",
              value: data.pendingVerifications.toString(),
              change: "-1.5%",
              isUp: false,
              icon: <StorefrontIcon />,
              color: "warning",
            },
            {
              title: "Available Vehicles",
              value: data.availableVehicles.toString(),
              change: "+2.1%",
              isUp: true,
              icon: <DirectionsCarIcon />,
              color: "info",
            },
            {
              title: "Pending Inspections",
              value: data.pendingInspections.toString(),
              change: "+8.4%",
              isUp: true,
              icon: <AttachMoneyIcon />,
              color: "error",
            },
          ]);
        }
      } catch (_error) {
        logger.error("Failed to fetch dashboard summary:", _error);
        setSummaryData([
          {
            title: "Total Users",
            value: "892",
            change: "+12.5%",
            isUp: true,
            icon: <PeopleAltIcon />,
            color: "primary",
          },
          {
            title: "Active Bookings",
            value: "145",
            change: "+5.2%",
            isUp: true,
            icon: <TrendingUpIcon />,
            color: "success",
          },
          {
            title: "Pending Verifications",
            value: "23",
            change: "-1.5%",
            isUp: false,
            icon: <StorefrontIcon />,
            color: "warning",
          },
          {
            title: "Available Vehicles",
            value: "342",
            change: "+2.1%",
            isUp: true,
            icon: <DirectionsCarIcon />,
            color: "info",
          },
          {
            title: "Pending Inspections",
            value: "12",
            change: "+8.4%",
            isUp: true,
            icon: <AttachMoneyIcon />,
            color: "error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    void fetchDashboardData();
  }, [session?.accessToken, status]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Grid container spacing={3}>
      {summaryData.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card
            elevation={0}
            sx={{
              borderRadius: "16px",
              bgcolor: "background.paper", // هيقلب أبيض في الفاتح ورمادي غامق في الدارك
              border: "1px solid",
              borderColor: "divider", // خط فاصل متناسق مع المود
              boxShadow: "shadow.card",
              transition: "all 0.2s",
              "&:hover": { transform: "translateY(-4px)" },
            }}
          >
            <CardContent sx={{ p: "24px !important" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Avatar
                  sx={{
                    // لو دارك هنخلي الخلفية شفافة شوية من اللون الأساسي، ولو لايت هتبقى أفتح
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
                  variant={isDark ? "filled" : "outlined"} // في الدارك الـ filled أحسن
                  sx={{ fontWeight: "bold", borderRadius: "8px" }}
                />
              </Box>
              {/* text.primary هيخلي اللون أسود في اللايت، وأبيض في الدارك تلقائياً */}
              <Typography variant="h4" sx={{ color: "text.primary", fontWeight: "800", mb: 0.5 }}>
                {stat.title === "Active Vehicles" ? (vehicleStats?.availableVehicles ?? stat.value) : stat.value}
              </Typography>
              {/* text.secondary للون الرمادي المريح للعين */}
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}
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
