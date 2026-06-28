"use client";

import { useMemo } from "react";
import { Alert, Box, Card, CardContent, MenuItem, Select, Skeleton, Typography, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import BarChartIcon from "@mui/icons-material/BarChart";
import type { DriverMonthlyEarningPoint } from "@/api-clients/driver-earnings/driver-earnings";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function safeNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

interface MonthlyEarningsChartProps {
  readonly data: DriverMonthlyEarningPoint[] | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly currentYear: number;
  readonly yearOptions: readonly number[];
  readonly year: number;
  readonly onYearChange: (year: number) => void;
  readonly mounted: boolean;
  readonly labels: {
    readonly monthlyEarnings: string;
    readonly noRevenueRecorded: string;
    readonly completedBookingsWillAppear: string;
  };
}

export default function MonthlyEarningsChart({
  data,
  loading,
  error,
  currentYear,
  yearOptions,
  year,
  onYearChange,
  mounted,
  labels,
}: MonthlyEarningsChartProps) {
  const theme = useTheme();
  const hasChartData = useMemo(() => Boolean(data && data.some(p => safeNum(p.earnings) > 0)), [data]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <BarChartIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {labels.monthlyEarnings}
            </Typography>
          </Box>
          <Select
            size="small"
            value={year}
            onChange={e => {
              onYearChange(e.target.value);
            }}
            slotProps={{ input: { "aria-label": "Year selector" } }}
            sx={{
              minWidth: 96,
              "& .MuiSelect-select": { fontWeight: 600, py: 0.75 },
            }}
            disabled={loading}
          >
            {yearOptions.map(y => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {error ? (
          <Alert severity="error" variant="outlined" sx={{ height: 280, display: "flex", alignItems: "center" }}>
            {error}
          </Alert>
        ) : loading ? (
          <Skeleton variant="rectangular" width="100%" height={280} sx={{ borderRadius: 2 }} />
        ) : !hasChartData ? (
          <Box
            sx={{
              width: "100%",
              height: 280,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <BarChartIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {labels.noRevenueRecorded.replace("{year}", currentYear.toString())}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {labels.completedBookingsWillAppear}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: 280, minWidth: 0, position: "relative", overflow: "hidden" }}>
            {mounted && (
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <BarChart data={data ?? []} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => formatCurrency(value)}
                    width={68}
                  />
                  <Tooltip
                    cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                      background: theme.palette.background.paper,
                      boxShadow: theme.shadows[3],
                    }}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), "Earnings"]}
                  />
                  <Bar
                    dataKey="earnings"
                    name="Earnings"
                    fill={theme.palette.primary.main}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
