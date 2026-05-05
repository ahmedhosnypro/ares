"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
// eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetchJson } from "@/utils/api-client";
import { useSession } from "next-auth/react";
import { logger } from "@/utils/logger";

interface RawBooking {
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#eab308",
  Confirmed: "#3b82f6",
  Active: "#22c55e",
  Completed: "#a855f7",
  Cancelled: "#ef4444",
};

const EXPECTED_STATUSES = ["Pending", "Confirmed", "Active", "Completed", "Cancelled"];

export default function BookingOverview() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.accessToken) return;
      try {
        setLoading(true);
        setError(false);
        const data = await apiFetchJson<{
          resultData?: RawBooking[];
          data?: RawBooking[];
          items?: RawBooking[];
        }>("api/admin/bookings/search/1/10000", {
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
            size: 10000,
            language: "en",
          }),
        });

        const bookingsList = data.resultData || data.data || data.items || [];
        
        const counts: Record<string, number> = {
          Pending: 0,
          Confirmed: 0,
          Active: 0,
          Completed: 0,
          Cancelled: 0,
        };

        let totalBookings = 0;

        bookingsList.forEach((b: RawBooking) => {
          const status = b.status || "Pending";
          if (status in counts) {
            counts[status]++;
            totalBookings++;
          }
        });

        const formattedStats = EXPECTED_STATUSES.map((key) => ({
          name: key,
          value: counts[key] || 0,
          color: STATUS_COLORS[key],
        }));

        setStats(formattedStats);
        setTotal(totalBookings);
      } catch (err) {
        logger.error("Failed to fetch bookings for overview", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      void fetchBookings();
    }
  }, [session]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          <Typography color="error">Failed to load booking statistics.</Typography>
        </Box>
      );
    }

    if (total === 0) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          <Typography color="text.secondary">No bookings found.</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", minHeight: 250 }}>
        {/* Donut Chart Container */}
        <Box sx={{ position: "relative", width: { xs: "100%", md: "50%" }, height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.filter(s => s.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1000}
                animationBegin={0}
              >
                {stats.filter(s => s.value > 0).map((entry, index) => (
                  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
                  <Cell key={`cell-${String(index)}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: unknown) => [`${String(value ?? 0)} Bookings`, 'Count']}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: theme.shadows[3] }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: "800", lineHeight: 1, color: "text.primary" }}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "700", textTransform: "uppercase", mt: 0.5 }}>
              Total
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ width: { xs: "100%", md: "50%" }, pl: { xs: 0, md: 4 }, mt: { xs: 4, md: 0 }, display: "flex", flexDirection: "column", gap: 2 }}>
          {stats.map((stat) => {
            const percentage = total > 0 ? ((stat.value / total) * 100).toFixed(1) : "0.0";
            return (
              <Box key={stat.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: stat.color }} />
                  <Typography variant="body2" sx={{ fontWeight: "600", color: "text.primary" }}>
                    {stat.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: "700", color: "text.primary" }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 45, textAlign: "right", fontWeight: "600" }}>
                    {percentage}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.main",
        height: "100%",
        boxShadow: "shadow.card",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: "700", mb: 3 }}>
          Booking Overview
        </Typography>
        
        {renderContent()}
      </CardContent>
    </Card>
  );
}
