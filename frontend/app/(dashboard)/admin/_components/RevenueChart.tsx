"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  SelectChangeEvent,
} from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toApiUrl } from "@/utils/api-client";

export interface ChartDataPointDto {
  date: string;
  revenue: number;
  bookings: number;
  refunds: number;
}

export interface RevenueOverviewDto {
  totalRevenue: number;
  totalBookings: number;
  totalRefunds: number;
  chartData: ChartDataPointDto[];
}

export default function RevenueChart() {
  const { data: session } = useSession();
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("ThisMonth");
  const [data, setData] = useState<RevenueOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 150);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if there's no session yet, but maybe it's not strictly required
      // if it's handled by middleware, but good to wait for the token.
      if (!session) return;

      try {
        setLoading(true);
        setError(null);

        const token = session.accessToken;
        const response = await axios.get<RevenueOverviewDto>(
          toApiUrl(`/api/dashboard/revenue-overview?filter=${filter}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setData(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const responseData = err.response?.data as Record<string, unknown> | undefined;
          const apiMessage = typeof responseData?.message === "string" ? responseData.message : null;
          setError(apiMessage || "Failed to load revenue overview");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load revenue overview");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [filter, session]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: theme.palette.border.main,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Revenue Overview
          </Typography>
          <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={filter}
              onChange={handleFilterChange}
              sx={{ minWidth: 140, borderRadius: 2, bgcolor: "background.paper" }}
            >
              <MenuItem value="ThisMonth">This Month</MenuItem>
              <MenuItem value="LastMonth">Last Month</MenuItem>
              <MenuItem value="ThisYear">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {loading ? <Skeleton width={100} /> : `$${(data?.totalRevenue || 0).toLocaleString()}`}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: theme.palette.success.main }} />
              <Typography variant="body2" color="text.secondary">
                Bookings
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {loading ? <Skeleton width={100} /> : `$${(data?.totalBookings || 0).toLocaleString()}`}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: theme.palette.error.main }} />
              <Typography variant="body2" color="text.secondary">
                Refunds
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {loading ? <Skeleton width={100} /> : `$${(data?.totalRefunds || 0).toLocaleString()}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: "100%", height: 300, minWidth: 0, minHeight: 0 }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
          ) : (
            mounted &&
            data && (
              <ResponsiveContainer width="100%" height={300} minWidth={0}>
                <LineChart data={data.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.border.light} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    tickFormatter={(value: number) => `$${value === 0 ? "0" : (value / 1000).toString() + "K"}`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${theme.palette.border.main}`,
                      boxShadow: theme.palette.shadow.card,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke={theme.palette.success.main}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="refunds"
                    name="Refunds"
                    stroke={theme.palette.error.main}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
