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
  Stack,
} from "@mui/material";
import { ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toApiUrl } from "@/utils/api-client";

export interface ChartDataPointDto {
  date: string;
  revenue: number; // Represents Gross Revenue
  platformRevenue: number;
  supplierRevenue: number;
  bookings: number;
  refunds: number;
  netRevenue: number;
}

export interface RevenueOverviewDto {
  totalRevenue: number;
  platformRevenue: number;
  supplierRevenue: number;
  totalBookings: number;
  totalRefunds: number;
  netRevenue: number;
  chartData: ChartDataPointDto[];
}

export interface TooltipPayload {
  dataKey: string;
  value: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: 2,
          p: 2,
          boxShadow: theme.palette.shadow.cardHover,
          minWidth: 200,
        }}
      >
        <Typography sx={{ fontWeight: 700, mb: 1.5, color: theme.palette.text.primary }}>Date: {label}</Typography>
        <Stack sx={{ gap: 1 }}>
          <Typography sx={{ color: theme.palette.status.active.main, fontSize: "0.875rem" }}>
            ● Gross Bookings: ${payload.find(p => p.dataKey === "bookings")?.value.toLocaleString() || 0}
          </Typography>
          <Typography sx={{ color: theme.palette.status.cancelled.main, fontSize: "0.875rem" }}>
            ■ Refunds: ${payload.find(p => p.dataKey === "refunds")?.value.toLocaleString() || 0}
          </Typography>
          <Typography
            sx={{
              color: theme.palette.primary.main,
              fontSize: "0.875rem",
              fontWeight: 600,
              pt: 0.5,
              borderTop: `1px dashed ${theme.palette.border.light}`,
            }}
          >
            ◆ Net Revenue: ${payload.find(p => p.dataKey === "netRevenue")?.value.toLocaleString() || 0}
          </Typography>
        </Stack>
      </Box>
    );
  }
  return null;
};

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
      className="flex flex-col w-full rounded-2xl transition-all duration-300"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.main}`,
        boxShadow: theme.palette.shadow.card,
        height: "100%",
        "&:hover": {
          boxShadow: theme.palette.shadow.cardHover,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, minWidth: 0 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Revenue Overview
          </Typography>
          <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Select
              value={filter}
              onChange={handleFilterChange}
              sx={{
                minWidth: 140,
                borderRadius: 2,
                bgcolor: theme.palette.background.default,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.border.main,
                },
              }}
            >
              <MenuItem value="ThisMonth">This Month</MenuItem>
              <MenuItem value="LastMonth">Last Month</MenuItem>
              <MenuItem value="ThisYear">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 3 Metric Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Revenue (Net) - Blue Theme */}
          <Box
            className="rounded-xl flex flex-col justify-center transition-transform hover:-translate-y-1"
            sx={{
              p: 3,
              backgroundColor: theme.palette.background.default,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              borderTop: `1px solid ${theme.palette.border.light}`,
              borderRight: `1px solid ${theme.palette.border.light}`,
              borderBottom: `1px solid ${theme.palette.border.light}`,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
              Net Revenue
            </Typography>
            <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>
              {loading ? <Skeleton width={120} /> : `$${(data?.netRevenue || 0).toLocaleString()}`}
            </Typography>
          </Box>

          {/* Gross Bookings - Green Theme */}
          <Box
            className="rounded-xl flex flex-col justify-center transition-transform hover:-translate-y-1"
            sx={{
              p: 3,
              backgroundColor: theme.palette.background.default,
              borderLeft: `4px solid ${theme.palette.status.active.main}`,
              borderTop: `1px solid ${theme.palette.border.light}`,
              borderRight: `1px solid ${theme.palette.border.light}`,
              borderBottom: `1px solid ${theme.palette.border.light}`,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
              Gross Bookings
            </Typography>
            <Typography variant="h4" sx={{ color: theme.palette.status.active.main, fontWeight: 800 }}>
              {loading ? <Skeleton width={120} /> : `$${(data?.totalBookings || 0).toLocaleString()}`}
            </Typography>
          </Box>

          {/* Refunds - Red Theme */}
          <Box
            className="rounded-xl flex flex-col justify-center transition-transform hover:-translate-y-1"
            sx={{
              p: 3,
              backgroundColor: theme.palette.background.default,
              borderLeft: `4px solid ${theme.palette.status.cancelled.main}`,
              borderTop: `1px solid ${theme.palette.border.light}`,
              borderRight: `1px solid ${theme.palette.border.light}`,
              borderBottom: `1px solid ${theme.palette.border.light}`,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, fontWeight: 500 }}>
              Refunds
            </Typography>
            <Typography variant="h4" sx={{ color: theme.palette.status.cancelled.main, fontWeight: 800 }}>
              {loading ? <Skeleton width={120} /> : `$${(data?.totalRefunds || 0).toLocaleString()}`}
            </Typography>
          </Box>
        </div>

        {/* Chart Section */}
        <Box sx={{ width: "100%", height: 350, minWidth: 0, minHeight: 0 }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height={350} sx={{ borderRadius: 2 }} />
          ) : (
            mounted &&
            data && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={data.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.border.light} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 13 }}
                    dy={15}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `$${value === 0 ? "0" : (value / 1000).toString() + "K"}`}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 13 }}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: theme.palette.border.light, opacity: 0.4 }} />

                  {/* Bookings Bar (Base) */}
                  <Bar
                    yAxisId="left"
                    dataKey="bookings"
                    stackId="a"
                    fill={theme.palette.status.active.main}
                    radius={[0, 0, 4, 4]}
                    barSize={40}
                  />
                  {/* Refunds Bar (Stacked on top) */}
                  <Bar
                    yAxisId="left"
                    dataKey="refunds"
                    stackId="a"
                    fill={theme.palette.status.cancelled.main}
                    radius={[4, 4, 0, 0]}
                  />
                  {/* Net Revenue Area Chart (Smooth overlay) */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="netRevenue"
                    stroke={theme.palette.primary.main}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
