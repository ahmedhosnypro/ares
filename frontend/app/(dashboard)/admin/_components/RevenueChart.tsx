"use client";

import { Card, CardContent, Typography, Box, useTheme, FormControl, Select, MenuItem } from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { RevenueDataPoint } from "./mockData";

export default function RevenueChart({ data }: { readonly data: readonly RevenueDataPoint[] }) {
  const theme = useTheme();

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalBookings = data.reduce((sum, item) => sum + (item.bookings || 0), 0);
  const totalRefunds = data.reduce((sum, item) => sum + (item.refunds || 0), 0);

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
            <Select defaultValue="this_month" sx={{ minWidth: 140, borderRadius: 2, bgcolor: "background.paper" }}>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="this_year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ${totalRevenue.toLocaleString()}
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
              ${totalBookings.toLocaleString()}
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
              ${totalRefunds.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: "100%", height: 300, minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
        </Box>
      </CardContent>
    </Card>
  );
}
