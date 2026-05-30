"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import { DashboardSummary } from "./types";
import BookingOverview from "./_components/BookingOverview";
import RecentActivity from "./_components/RecentActivity";
import { useAdminVehicleStats } from "@/api-clients/cars/cars";
import VehicleStats from "@/app/(dashboard)/_components/VehicleStats";

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

export default function AdminDashboardClient() {
  const { data: session, status } = useSession({
    required: true,
  });

  const [summaryData, setSummaryData] = useState<SummaryItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { stats: vehicleStats } = useAdminVehicleStats(session?.accessToken);

  useEffect(() => {
    if (status === "authenticated" && !session.user.roles.includes("Admin")) {
      window.location.href = "/";
      return;
    }

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
              title: "Total Suppliers",
              value: safeNum(data.totalSuppliers).toLocaleString(),
              change: "+8.4%",
              isUp: true,
              icon: <StorefrontIcon fontSize="medium" />,
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
                id: (b.id || b._id || "").toString(),
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
            title: "Total Suppliers",
            value: "12",
            change: "+8.4%",
            isUp: true,
            icon: <StorefrontIcon fontSize="medium" />,
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const summaryItems = summaryData.map(stat => ({
    label: stat.title,
    value: stat.title === "Active Vehicles" ? (vehicleStats?.availableVehicles ?? stat.value) : stat.value,
    color: stat.color,
    icon: stat.icon,
    change: stat.change,
    isUp: stat.isUp,
  }));

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
        <motion.div variants={itemVariants}>
          <VehicleStats items={summaryItems} />
        </motion.div>

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
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
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
                            <TableCell sx={{ fontWeight: "600" }}>
                              {row.id.length > 8 ? row.id.substring(0, 8).toUpperCase() : row.id}
                            </TableCell>
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
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: theme.palette.border.main,
                  height: "100%",
                  boxShadow: theme.palette.shadow.card,
                })}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "700" }}>
                      System Status
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 2 }}>
                    {[
                      {
                        label: "Server CPU Load",
                        value: "32%",
                        amount: 32,
                        color: "primary" as const,
                      },
                      {
                        label: "Memory Usage",
                        value: "68%",
                        amount: 68,
                        color: "warning" as const,
                      },
                      {
                        label: "Storage Capacity",
                        value: "45%",
                        amount: 45,
                        color: "success" as const,
                      },
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
                            borderRadius: 2,
                            bgcolor: "border.light",
                          }}
                        />
                      </Box>
                    ))}

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
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
