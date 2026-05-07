"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  CircularProgress,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { DashboardSummary } from "./types";
import BookingOverview from "./_components/BookingOverview";
import RecentActivity from "./_components/RecentActivity";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

interface SummaryItem {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "error";
}

interface BookingListItem {
  id: string;
  customer: string;
  car: string;
  date: string;
  status: string;
  amount: string;
}

interface RawBooking {
  id?: string | number;
  _id?: string | number;
  driver?: { fullName?: string };
  car?: { name?: string };
  from?: string | number | Date;
  status?: string;
  price?: string | number;
}

export default function AdminDashboardPage() {
  const theme = useTheme();
  const { data: session, status } = useSession();

  const [summaryData, setSummaryData] = useState<SummaryItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (session?.accessToken) {
          const data = await apiFetchJson<DashboardSummary>("api/dashboard/summary", {
            accessToken: session.accessToken,
          });

          // Defensive coercion — backend can return undefined/null for any of these fields
          const safeNum = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
          setSummaryData([
            {
              title: "Total Bookings",
              value: safeNum(data.totalBookings).toLocaleString(),
              change: "+12.5%",
              isUp: true,
              icon: <EventAvailableIcon fontSize="medium" />,
              color: "primary",
            },
            {
              title: "Active Vehicles",
              value: safeNum(data.totalVehicles).toLocaleString(),
              change: "+4.2%",
              isUp: true,
              icon: <DirectionsCarIcon fontSize="medium" />,
              color: "success",
            },
            {
              title: "Total Revenue",
              value: `$${safeNum(data.totalRevenue).toLocaleString()}`,
              change: "+18.2%",
              isUp: true,
              icon: <AttachMoneyIcon fontSize="medium" />,
              color: "warning",
            },
            {
              title: "Total Users",
              value: safeNum(data.totalUsers).toLocaleString(),
              change: "-2.1%",
              isUp: false,
              icon: <PeopleAltIcon fontSize="medium" />,
              color: "error",
            },
          ]);

          // Fetch recent bookings
          try {
            const bookingsData = await apiFetchJson<{
              resultData?: RawBooking[];
              data?: RawBooking[];
              items?: RawBooking[];
            }>("api/admin/bookings/search/1/5", {
              method: "POST",
              accessToken: session.accessToken,
              body: JSON.stringify({
                userId: null,
                suppliers: session.user.roles.includes("Supplier") ? [session.user.id] : null,
                statuses: null,
                carId: null,
                filter: {
                  from: null,
                  to: null,
                  keyword: null,
                  pickupLocation: null,
                  dropOffLocation: null,
                },
                page: 1,
                size: 5,
                language: "en",
              }),
            });
            const bookingsList = bookingsData.resultData || bookingsData.data || bookingsData.items;
            if (bookingsList) {
              const mappedBookings = bookingsList.map((b: RawBooking) => ({
                id: (b.id || b._id || "").toString().substring(0, 8).toUpperCase(),
                customer: b.driver?.fullName || "Guest",
                car: b.car?.name || "Vehicle",
                date: b.from ? new Date(b.from).toLocaleDateString() : "",
                status: b.status || "Pending",
                amount: `$${String(b.price || 0)}`,
              }));
              setRecentBookings(mappedBookings);
            }
          } catch (bkgErr) {
            logger.error("Failed to fetch recent bookings", bkgErr);
          }
        }
      } catch (error) {
        logger.error("Failed to fetch real data, using mock data", error);
        // Fallback to Mock Data
        setSummaryData([
          {
            title: "Total Bookings",
            value: "1,284",
            change: "+12.5%",
            isUp: true,
            icon: <EventAvailableIcon fontSize="medium" />,
            color: "primary",
          },
          {
            title: "Active Vehicles",
            value: "342",
            change: "+4.2%",
            isUp: true,
            icon: <DirectionsCarIcon fontSize="medium" />,
            color: "success",
          },
          {
            title: "Total Revenue",
            value: "$45,231",
            change: "+18.2%",
            isUp: true,
            icon: <AttachMoneyIcon fontSize="medium" />,
            color: "warning",
          },
          {
            title: "Total Users",
            value: "892",
            change: "-2.1%",
            isUp: false,
            icon: <PeopleAltIcon fontSize="medium" />,
            color: "error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      void fetchDashboardData();
    }
  }, [session, status]);

  const getStatusColor = (status: string): "primary" | "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "Active":
        return "primary";
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      case "Cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", fontFamily: "inherit" }}>
      {/* Greeting (kept — replaces the page title that now lives in the navbar) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Welcome back{session?.user.firstName ? `, ${session.user.firstName}` : ", Admin"}. Here&apos;s what&apos;s
          happening today.
        </Typography>
      </Box>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Stat cards — restyled to match new design (horizontal layout: icon-left, content-right) */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {summaryData.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <motion.div variants={itemVariants}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: theme => theme.palette.shadow.card,
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: theme => theme.palette.shadow.cardHover,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette[stat.color].main, 0.12),
                          color: `${stat.color}.main`,
                          width: 56,
                          height: 56,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 600, fontSize: "0.85rem", mb: 0.25 }}
                          noWrap
                        >
                          {stat.title}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.1 }}
                          noWrap
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
                      {stat.isUp ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: stat.isUp ? "success.main" : "error.main",
                          fontSize: "0.78rem",
                        }}
                      >
                        {stat.change}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                        from last month
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <BookingOverview />
            </motion.div>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <RecentActivity />
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div variants={itemVariants}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: "700" }}>
                      Recent Bookings
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <TableContainer>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                            }}
                          >
                            Booking ID
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                            }}
                          >
                            Customer
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                            }}
                          >
                            Vehicle
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                            }}
                          >
                            Date
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                            }}
                          >
                            Amount
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "text.secondary",
                              fontWeight: "600",
                              borderBottom: "2px solid",
                              borderColor: "divider",
                              textAlign: "right",
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentBookings.map(row => (
                          <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell sx={{ fontWeight: "600" }}>{row.id}</TableCell>
                            <TableCell>{row.customer}</TableCell>
                            <TableCell>{row.car}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell sx={{ fontWeight: "700" }}>{row.amount}</TableCell>
                            <TableCell sx={{ textAlign: "right" }}>
                              <Chip
                                label={row.status}
                                color={getStatusColor(row.status)}
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: "600", borderRadius: 2 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div variants={itemVariants}>
              <Card
                elevation={0}
                sx={theme => ({
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: "700" }}>
                      System Status
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 2 }}>
                    {[
                      { label: "Server CPU Load", value: "32%", amount: 32, color: "primary" as const },
                      { label: "Memory Usage", value: "68%", amount: 68, color: "warning" as const },
                      { label: "Storage Capacity", value: "45%", amount: 45, color: "success" as const },
                    ].map((item, i) => (
                      <Box key={i}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: "600" }}>
                            {item.label}
                          </Typography>
                          <Typography variant="body2" color={`${item.color}.main`} sx={{ fontWeight: "bold" }}>
                            {item.value}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.amount}
                          color={item.color}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "border.light",
                          }}
                        />
                      </Box>
                    ))}

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 3,
                        bgcolor: "border.light",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      <TaskAltIcon color="success" />
                      <Box>
                        <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: "bold" }}>
                          All Systems Operational
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          No incidents reported in the last 24 hours.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}
