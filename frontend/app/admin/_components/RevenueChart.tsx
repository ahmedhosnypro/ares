"use client";
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: "divider", mb: 3 }}>
      <CardContent sx={{  p: 6 }}>
        <Typography variant="h6" fontWeight="700" gutterBottom>Revenue Overview (Last 7 Days)</Typography>
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke={theme.palette.primary.main} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}