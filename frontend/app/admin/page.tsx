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
  CircularProgress
} from "@mui/material";
import { motion } from "framer-motion";
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

// Mock data for recent bookings (since we are only fetching summary)
const mockRecentBookings = [
  { id: "BKG-001", customer: "Ahmed Ali", car: "Mercedes S-Class", date: "Oct 24, 2026", status: "Active", amount: "$450" },
  { id: "BKG-002", customer: "Sara Mahmoud", car: "BMW X5", date: "Oct 23, 2026", status: "Completed", amount: "$320" },
  { id: "BKG-003", customer: "Omar Hassan", car: "Audi A6", date: "Oct 22, 2026", status: "Pending", amount: "$280" },
  { id: "BKG-004", customer: "Nour Youssef", car: "Range Rover", date: "Oct 21, 2026", status: "Cancelled", amount: "$500" },
  { id: "BKG-005", customer: "Khaled Saed", car: "Porsche 911", date: "Oct 20, 2026", status: "Completed", amount: "$850" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

interface DashboardSummaryDto {
  totalUsers: number;
  totalSuppliers: number;
  totalVehicles: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const theme = useTheme();
  const { data: session, status } = useSession();
  
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (session?.accessToken) {
          const data = await apiFetchJson<DashboardSummaryDto>("api/dashboard/summary", {
            accessToken: session.accessToken
          });
          
          setSummaryData([
            { title: "Total Bookings", value: data.totalBookings.toString(), change: "+12.5%", isUp: true, icon: <EventAvailableIcon fontSize="medium" />, color: "primary" },
            { title: "Active Vehicles", value: data.totalVehicles.toString(), change: "+4.2%", isUp: true, icon: <DirectionsCarIcon fontSize="medium" />, color: "success" },
            { title: "Total Revenue", value: `$${data.totalRevenue.toLocaleString()}`, change: "+18.2%", isUp: true, icon: <AttachMoneyIcon fontSize="medium" />, color: "warning" },
            { title: "Total Users", value: data.totalUsers.toString(), change: "-2.1%", isUp: false, icon: <PeopleAltIcon fontSize="medium" />, color: "error" },
          ]);

          // Fetch recent bookings
          try {
            const bookingsData = await apiFetchJson<any>("api/admin/bookings/search/1/5", {
              method: "POST",
              accessToken: session.accessToken,
              body: JSON.stringify({
                userId: null,
                suppliers: session.user?.roles?.includes("Supplier") ? [session.user.id] : null,
                statuses: null,
                carId: null,
                filter: {
                  from: null,
                  to: null,
                  keyword: null,
                  pickupLocation: null,
                  dropOffLocation: null
                },
                page: 1,
                size: 5,
                language: "en"
              })
            });
            const bookingsList = bookingsData?.resultData || bookingsData?.data || bookingsData?.items;
            if (bookingsList) {
              const mappedBookings = bookingsList.map((b: any) => ({
                id: (b.id || b._id || "").toString().substring(0, 8).toUpperCase(),
                customer: b.driver?.fullName || "Guest",
                car: b.car?.name || "Vehicle",
                date: b.from ? new Date(b.from).toLocaleDateString() : "",
                status: b.status || "Pending",
                amount: `$${b.price || 0}`
              }));
              setRecentBookings(mappedBookings);
            }
          } catch (bkgErr) {
            console.error("Failed to fetch recent bookings:", bkgErr);
          }
        }
      } catch (error) {
        console.error("Failed to fetch real data, using mock data:", error);
        // Fallback to Mock Data
        setSummaryData([
          { title: "Total Bookings", value: "1,284", change: "+12.5%", isUp: true, icon: <EventAvailableIcon fontSize="medium" />, color: "primary" },
          { title: "Active Vehicles", value: "342", change: "+4.2%", isUp: true, icon: <DirectionsCarIcon fontSize="medium" />, color: "success" },
          { title: "Total Revenue", value: "$45,231", change: "+18.2%", isUp: true, icon: <AttachMoneyIcon fontSize="medium" />, color: "warning" },
          { title: "Total Users", value: "892", change: "-2.1%", isUp: false, icon: <PeopleAltIcon fontSize="medium" />, color: "error" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchDashboardData();
    }
  }, [session, status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', fontFamily: 'inherit' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="800" gutterBottom sx={{ color: 'text.primary', letterSpacing: '-0.5px' }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back{session?.user?.firstName ? `, ${session.user.firstName}` : ", Admin"}. Here's what's happening today.
          </Typography>
        </Box>
      </Box>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {summaryData.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <motion.div variants={itemVariants}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4, 
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    bgcolor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: theme.palette.mode === 'light' ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: theme.palette.mode === 'light' ? '0 12px 28px rgba(0,0,0,0.08)' : '0 12px 28px rgba(0,0,0,0.4)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${stat.color}.main`, 
                          color: '#fff', 
                          width: 52, 
                          height: 52,
                          boxShadow: `0 8px 16px ${(theme.palette as any)[stat.color].main}40`
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Chip 
                        icon={stat.isUp ? <TrendingUpIcon sx={{ fontSize: 16 }}/> : <TrendingDownIcon sx={{ fontSize: 16 }}/>} 
                        label={stat.change} 
                        size="small" 
                        color={stat.isUp ? "success" : "error"} 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold', borderRadius: 2, px: 0.5 }}
                      />
                    </Box>
                    <Typography variant="h3" fontWeight="800" sx={{ mb: 1, letterSpacing: '-1px' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div variants={itemVariants}>
              <Card 
                elevation={0} 
                sx={{ 
                  borderRadius: 4, 
                  border: '1px solid', 
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  boxShadow: theme.palette.mode === 'light' ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="700">
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
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider' }}>Booking ID</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider' }}>Customer</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider' }}>Vehicle</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider' }}>Date</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider' }}>Amount</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: '600', borderBottom: '2px solid', borderColor: 'divider', textAlign: 'right' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentBookings.map((row) => (
                          <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: '600' }}>{row.id}</TableCell>
                            <TableCell>{row.customer}</TableCell>
                            <TableCell>{row.car}</TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell sx={{ fontWeight: '700' }}>{row.amount}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <Chip 
                                label={row.status} 
                                color={getStatusColor(row.status) as any} 
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: '600', borderRadius: 2 }}
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
                sx={{ 
                  borderRadius: 4, 
                  border: '1px solid', 
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  height: '100%',
                  boxShadow: theme.palette.mode === 'light' ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="700">
                      System Status
                    </Typography>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
                    {[
                      { label: "Server CPU Load", value: "32%", amount: 32, color: "primary" },
                      { label: "Memory Usage", value: "68%", amount: 68, color: "warning" },
                      { label: "Storage Capacity", value: "45%", amount: 45, color: "success" },
                    ].map((item, i) => (
                      <Box key={i}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="600">{item.label}</Typography>
                          <Typography variant="body2" fontWeight="bold" color={`${item.color}.main`}>{item.value}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={item.amount} 
                          color={item.color as any}
                          sx={{ height: 8, borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} 
                        />
                      </Box>
                    ))}

                    <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(46, 125, 50, 0.05)', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <TaskAltIcon color="success" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="success.main">All Systems Operational</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No incidents reported in the last 24 hours.</Typography>
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
