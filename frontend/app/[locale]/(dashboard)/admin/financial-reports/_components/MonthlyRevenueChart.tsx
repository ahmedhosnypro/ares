import { Card, CardContent, Typography, Box } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip, Area } from "recharts";
import { FinancialReportsData } from "./types";

interface MonthlyRevenueChartProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

export function MonthlyRevenueChart({ data, isRtl, t, theme }: Readonly<MonthlyRevenueChartProps>) {
  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 2.5, fontSize: "0.95rem" }}>
          {t("monthlyRevenue")}
        </Typography>
        <Box sx={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <AreaChart
              data={data.monthlyRevenue}
              margin={{ top: 10, right: isRtl ? -20 : 10, left: isRtl ? 10 : -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.border.light} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              />
              <YAxis
                orientation={isRtl ? "right" : "left"}
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.border.main,
                  borderRadius: 8,
                  boxShadow: theme.palette.shadow.card,
                  fontSize: "0.75rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={theme.palette.primary.main}
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
