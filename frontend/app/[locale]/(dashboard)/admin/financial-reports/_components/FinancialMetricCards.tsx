import { Grid, Card, CardContent, Box, Typography, Avatar, alpha } from "@mui/material";
import { Theme } from "@mui/material/styles";
import {
  TrendingUp as TrendingUpIcon,
  CheckCircleOutlined as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RotateLeft as RefundIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from "@mui/icons-material";
import { FinancialReportsData } from "./types";

interface FinancialMetricCardsProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

export function FinancialMetricCards({ data, isRtl, t, theme }: Readonly<FinancialMetricCardsProps>) {
  const metrics = [
    {
      title: t("totalRevenue"),
      value: data.totalRevenue,
      change: data.totalRevenueChange,
      avatarBg: alpha(theme.palette.primary.main, 0.1),
      avatarColor: theme.palette.primary.main,
      borderTopColor: theme.palette.primary.main,
      icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
      valueColor: "primary.main",
    },
    {
      title: t("paidAmount"),
      value: data.paidAmount,
      change: data.paidAmountChange,
      avatarBg: alpha(theme.palette.status.active.main, 0.1),
      avatarColor: theme.palette.status.active.main,
      borderTopColor: theme.palette.status.active.main,
      icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
      valueColor: "status.active.main",
    },
    {
      title: t("pendingAmount"),
      value: data.pendingAmount,
      change: data.pendingAmountChange,
      avatarBg: alpha(theme.palette.status.pending.main, 0.1),
      avatarColor: theme.palette.status.pending.main,
      borderTopColor: theme.palette.status.pending.main,
      icon: <ScheduleIcon sx={{ fontSize: 18 }} />,
      valueColor: "status.pending.main",
    },
    {
      title: t("refundedAmount"),
      value: data.refundedAmount,
      change: data.refundedAmountChange,
      avatarBg: alpha(theme.palette.status.cancelled.main, 0.1),
      avatarColor: theme.palette.status.cancelled.main,
      borderTopColor: theme.palette.status.cancelled.main,
      icon: <RefundIcon sx={{ fontSize: 18 }} />,
      valueColor: "status.cancelled.main",
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {metrics.map(metric => (
        <Grid key={metric.title} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
          <Card
            dir={isRtl ? "rtl" : "ltr"}
            sx={{
              boxShadow: theme.palette.shadow.card,
              borderRadius: 2,
              border: `1px solid ${theme.palette.border.light}`,
              borderTop: `4px solid ${metric.borderTopColor}`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              textAlign: isRtl ? "right" : "left",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.palette.shadow.cardHover,
                borderColor: theme.palette.border.main,
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSize: "0.75rem",
                  }}
                >
                  {metric.title}
                </Typography>
                <Avatar
                  sx={{
                    bgcolor: metric.avatarBg,
                    color: metric.avatarColor,
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                  }}
                >
                  {metric.icon}
                </Avatar>
              </Box>
              <Typography sx={{ fontWeight: 850, color: metric.valueColor, mb: 1.5, fontSize: "1.35rem" }}>
                EGP {metric.value.toLocaleString()}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    bgcolor: alpha(
                      metric.change >= 0 ? theme.palette.status.active.main : theme.palette.status.cancelled.main,
                      0.1
                    ),
                    color: metric.change >= 0 ? "status.active.main" : "status.cancelled.main",
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                  }}
                >
                  {metric.change >= 0 ? <ArrowUpIcon sx={{ fontSize: 14 }} /> : <ArrowDownIcon sx={{ fontSize: 14 }} />}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.7rem",
                    }}
                  >
                    {Math.abs(metric.change)}%
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                  {t("vsLastPeriod")}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
