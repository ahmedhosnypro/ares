"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, Typography, Box, useTheme, Skeleton } from "@mui/material";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { apiFetchJson } from "@/utils/api-client";
import { useSession } from "next-auth/react";
import { logger } from "@/utils/logger";

interface RawBooking {
  status?: string;
}

const EXPECTED_STATUSES = ["Pending", "Confirmed", "Active", "Completed", "Cancelled"];

export default function BookingOverview() {
  const theme = useTheme();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [total, setTotal] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchBookings = useCallback(
    async (isInitial = false) => {
      if (!session?.accessToken) return;
      try {
        if (isInitial) {
          setLoading(true);
        }
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

        if (!isMounted.current) return;

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

        // Map status to colors using theme
        const statusColorMap: Record<string, string> = {
          Pending: theme.palette.status.pending.main,
          Confirmed: theme.palette.status.confirmed.main,
          Active: theme.palette.status.active.main,
          Completed: theme.palette.status.completed.main,
          Cancelled: theme.palette.status.cancelled.main,
        };

        const formattedStats = EXPECTED_STATUSES.map(key => ({
          name: key,
          value: counts[key] || 0,
          fill: statusColorMap[key] || theme.palette.status.pending.main,
        }));

        setStats(formattedStats);
        setTotal(totalBookings);
      } catch (err) {
        logger.error("Failed to fetch bookings for overview", err);
        if (isInitial) setError(true);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [session, theme.palette.status]
  );

  useEffect(() => {
    if (session && loading) {
      void fetchBookings(true);
    }
  }, [session, fetchBookings, loading]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", minHeight: 250 }}>
          <Box sx={{ width: { xs: "100%", md: "50%" }, display: "flex", justifyContent: "center" }}>
            <Skeleton variant="circular" width={200} height={200} />
          </Box>
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              pl: { xs: 0, md: 4 },
              mt: { xs: 4, md: 0 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="text" height={30} width="80%" />
            ))}
          </Box>
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
              />
              <Tooltip
                formatter={(value?: unknown, name?: unknown) => [
                  `${((value as number) || 0).toLocaleString()} ${typeof name === "string" ? name.toLowerCase() : ""}`,
                  "",
                ]}
                separator=""
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "700", textTransform: "uppercase", mt: 0.5 }}
            >
              Total
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            pl: { xs: 0, md: 4 },
            mt: { xs: 4, md: 0 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {stats.map(stat => {
            const percentage = total > 0 ? ((stat.value / total) * 100).toFixed(1) : "0.0";
            return (
              <Box key={stat.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: stat.fill }} />
                  <Typography variant="body2" sx={{ fontWeight: "600", color: "text.primary" }}>
                    {stat.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: "700", color: "text.primary" }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 45, textAlign: "right", fontWeight: "600" }}
                  >
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
      sx={theme => ({
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        height: "100%",
        boxShadow: theme.palette.shadow.card,
      })}
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
