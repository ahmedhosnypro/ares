"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  useTheme,
  CircularProgress,
  Avatar,
  Chip,
  alpha,
} from "@mui/material";
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CreditCard as CardIcon,
  AttachMoney as CashIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalance as BankIcon,
  GetApp as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircleOutlined as CheckCircleIcon,
  Schedule as ScheduleIcon,
  RotateLeft as RefundIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
} from "recharts";
import { logger } from "@/utils/logger";
import { apiFetchJson } from "@/utils/api-client";
import { Theme } from "@mui/material/styles";

// --- Type Interfaces ---

export interface BookingSummaryItem {
  status: string;
  bookings: number;
  amount: number;
  percentage: number;
}

export interface MonthlyRevenueItem {
  month: string;
  revenue: number;
}

export interface PaymentMethodItem {
  method: string;
  paidAmount: number;
  percentage: number;
  amount?: number; // Optional fallback mapping
  fill?: string; // Optional style mapping
}

export interface RecentPaymentItem {
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export interface TopVehicleItem {
  vehicleName: string;
  rank: number;
  completedBookings: number;
  revenue: number;
}

export interface SupplierEarningItem {
  supplierName: string;
  totalVehicles: number;
  completedBookings: number;
  revenue: number;
  commission: number;
  netAmount: number;
}

export interface FinancialReportsData {
  totalRevenue: number;
  totalRevenueChange: number;
  paidAmount: number;
  paidAmountChange: number;
  pendingAmount: number;
  pendingAmountChange: number;
  refundedAmount: number;
  refundedAmountChange: number;
  bookingSummary: BookingSummaryItem[];
  monthlyRevenue: MonthlyRevenueItem[];
  paymentMethods: PaymentMethodItem[];
  recentPayments: RecentPaymentItem[];
  topVehicles: TopVehicleItem[];
  supplierEarnings: SupplierEarningItem[];
}

interface FinancialReportsClientProps {
  initialData: FinancialReportsData | null;
  accessToken: string;
  locale: string;
}

// --- Status & Icon Helpers ---

const getStatusColor = (theme: Theme, statusName: string) => {
  switch (statusName.toLowerCase()) {
    case "completed":
    case "paid":
    case "captured":
      return theme.palette.status.completed;
    case "active":
    case "authorized":
      return theme.palette.status.active;
    case "pending":
    case "pending payment":
    case "paymentpending":
      return theme.palette.status.pending;
    case "cancelled":
    case "failed":
    case "refunded":
      return theme.palette.status.cancelled;
    default:
      return theme.palette.status.pending;
  }
};

const getMethodIcon = (theme: Theme, method: string) => {
  switch (method.toLowerCase()) {
    case "card":
    case "visa":
    case "visa / card":
      return <CardIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />;
    case "cash":
      return <CashIcon sx={{ color: theme.palette.status.active.main, fontSize: 16 }} />;
    case "wallet":
      return <WalletIcon sx={{ color: theme.palette.secondary.main, fontSize: 16 }} />;
    case "bank":
    case "bank transfer":
      return <BankIcon sx={{ color: theme.palette.status.confirmed.main, fontSize: 16 }} />;
    default:
      return <CardIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />;
  }
};

// --- Sub-components to resolve cognitive complexity ---

// 1. Metric Cards Grid
interface FinancialMetricCardsProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

function FinancialMetricCards({ data, isRtl, t, theme }: Readonly<FinancialMetricCardsProps>) {
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
        <Grid key={metric.title} size={{ xs: 12, sm: 6, md: 3 }}>
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

// 2. Booking Summary Table
interface BookingSummaryTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

function BookingSummaryTable({ data, isRtl, t, theme }: Readonly<BookingSummaryTableProps>) {
  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>
          {t("bookingSummary")}
        </Typography>
      </Box>
      <TableContainer sx={{ border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 2.5,
                  pr: 1.5,
                }}
              >
                {t("status")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("bookingsCount")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("amount")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("percentage")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.bookingSummary.map(row => {
              const statusColors = getStatusColor(theme, row.status);
              return (
                <TableRow
                  key={row.status}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    transition: "all 0.2s ease",
                    "&:nth-of-type(even)": {
                      bgcolor: alpha(theme.palette.primary.main, 0.015),
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.035),
                    },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ py: 1, fontSize: "0.75rem", pl: 2.5, pr: 1.5 }}>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(statusColors.main, 0.1),
                        color: statusColors.main,
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        height: 20,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1, color: "text.secondary" }}
                  >
                    {row.bookings}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 800, fontSize: "0.75rem", py: 1, color: "text.primary" }}
                  >
                    EGP {row.amount.toLocaleString()}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1, pl: 1.5, pr: 2.5, color: "text.secondary" }}
                  >
                    {row.percentage}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// 3. Monthly Revenue Chart
interface MonthlyRevenueChartProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

function MonthlyRevenueChart({ data, isRtl, t, theme }: Readonly<MonthlyRevenueChartProps>) {
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

// 4. Payment Methods Chart
interface PaymentMethodsChartProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
  donutColors: string[];
}

function PaymentMethodsChart({ data, isRtl, t, theme, donutColors }: Readonly<PaymentMethodsChartProps>) {
  // Pre-calculate colors and add them to data, resolving the Recharts Cell deprecation warning
  const paymentMethodsWithColors = data.paymentMethods.map((entry, index) => ({
    ...entry,
    amount: entry.paidAmount, // Make sure amount maps properly to Pie's dataKey
    fill: donutColors[index % donutColors.length],
  }));

  return (
    <Card
      dir={isRtl ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: isRtl ? "right" : "left",
      }}
    >
      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 2, fontSize: "0.95rem" }}>
          {t("paymentMethods")}
        </Typography>
        {data.paymentMethods.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ position: "relative", width: 130, height: 130, mb: 2 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={paymentMethodsWithColors}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="amount"
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Content */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                  }}
                >
                  {t("amount")}
                </Typography>
                <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: "0.9rem" }}>
                  {data.paidAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ width: "100%", mt: 1 }}>
              {paymentMethodsWithColors.map(entry => (
                <Box
                  key={entry.method}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: entry.fill,
                      }}
                    />
                    <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.75rem" }}>
                      {entry.method}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "text.secondary", fontWeight: 800, fontSize: "0.75rem" }}>
                    {entry.percentage}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4, fontSize: "0.8rem" }}>
            {t("noData")}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// 5. Recent Payments Table
interface RecentPaymentsTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
  locale: string;
}

function RecentPaymentsTable({ data, isRtl, t, theme, locale }: Readonly<RecentPaymentsTableProps>) {
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
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>
          {t("recentPayments")}
        </Typography>
      </Box>
      <TableContainer sx={{ border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 2.5,
                  pr: 1.5,
                }}
              >
                {t("bookingNumber")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("customer")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("vehicle")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("amount")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("method")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("status")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("date")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.recentPayments.map((row, i) => {
              const statusColors = getStatusColor(theme, row.status);
              return (
                <TableRow
                  key={`pay-${row.bookingNumber}-${i.toString()}`}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:nth-of-type(even)": {
                      bgcolor: alpha(theme.palette.primary.main, 0.015),
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.035),
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      color: "primary.main",
                      fontSize: "0.75rem",
                      py: 1.25,
                      pl: 2.5,
                      pr: 1.5,
                    }}
                  >
                    {row.bookingNumber}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}>
                    {row.customerName}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem", py: 1.25 }}>
                    {row.vehicleName}
                  </TableCell>
                  <TableCell
                    align={isRtl ? "left" : "right"}
                    sx={{ fontWeight: 800, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}
                  >
                    EGP {row.amount.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      {getMethodIcon(theme, row.method)}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          textTransform: "capitalize",
                          fontSize: "0.68rem",
                          color: "text.secondary",
                        }}
                      >
                        {row.method}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(statusColors.main, 0.1),
                        color: statusColors.main,
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        height: 20,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem", py: 1.25, pl: 1.5, pr: 2.5 }}>
                    {new Date(row.date).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// 6. Top Vehicles Table
interface TopVehiclesTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

function TopVehiclesTable({ data, isRtl, t, theme }: Readonly<TopVehiclesTableProps>) {
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
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>{t("topVehicles")}</Typography>
      </Box>
      <TableContainer sx={{ border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 2.5,
                  pr: 1.5,
                }}
              >
                {t("rank")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("vehicle")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("bookingsCount")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("amount")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topVehicles.map(row => (
              <TableRow
                key={row.vehicleName}
                sx={{
                  transition: "all 0.2s ease",
                  "&:nth-of-type(even)": {
                    bgcolor: alpha(theme.palette.primary.main, 0.015),
                  },
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.035),
                  },
                }}
              >
                <TableCell sx={{ py: 1, pl: 2.5, pr: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: row.rank === 1 ? "secondary.main" : "background.default",
                      color: row.rank === 1 ? "secondary.contrastText" : "text.secondary",
                      border: `1px solid ${row.rank === 1 ? theme.palette.secondary.main : theme.palette.border.main}`,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      borderRadius: 1,
                    }}
                  >
                    {row.rank}
                  </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1, color: "text.primary" }}>
                  {row.vehicleName}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1, color: "text.secondary" }}
                >
                  {row.completedBookings}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 800, color: "primary.main", fontSize: "0.75rem", py: 1, pl: 1.5, pr: 2.5 }}
                >
                  EGP {row.revenue.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// 7. Supplier Earnings Table
interface SupplierEarningsTableProps {
  data: FinancialReportsData;
  isRtl: boolean;
  t: (key: string) => string;
  theme: Theme;
}

function SupplierEarningsTable({ data, isRtl, t, theme }: Readonly<SupplierEarningsTableProps>) {
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
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}>
          {t("supplierEarnings")}
        </Typography>
      </Box>
      <TableContainer sx={{ border: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 2.5,
                  pr: 1.5,
                }}
              >
                {t("supplierName")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("totalVehicles")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("bookingsCount")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("amount")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("commission")}
              </TableCell>
              <TableCell
                align={isRtl ? "left" : "right"}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  py: 1.25,
                  color: "text.secondary",
                  borderBottom: `1px solid ${theme.palette.border.main}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  pl: 1.5,
                  pr: 2.5,
                }}
              >
                {t("netAmount")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.supplierEarnings.map(row => (
              <TableRow
                key={row.supplierName}
                sx={{
                  transition: "all 0.2s ease",
                  "&:nth-of-type(even)": {
                    bgcolor: alpha(theme.palette.primary.main, 0.015),
                  },
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.035),
                  },
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    py: 1.25,
                    pl: 2.5,
                    pr: 1.5,
                    color: "text.primary",
                  }}
                >
                  {row.supplierName}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontSize: "0.75rem", py: 1.25, color: "text.secondary" }}
                >
                  {row.totalVehicles}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontSize: "0.75rem", py: 1.25, color: "text.secondary" }}
                >
                  {row.completedBookings}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.25, color: "text.primary" }}
                >
                  EGP {row.revenue.toLocaleString()}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{ color: "status.cancelled.main", fontSize: "0.75rem", py: 1.25, fontWeight: 600 }}
                >
                  EGP {row.commission.toLocaleString()}
                </TableCell>
                <TableCell
                  align={isRtl ? "left" : "right"}
                  sx={{
                    fontWeight: 800,
                    color: "status.active.main",
                    fontSize: "0.75rem",
                    py: 1.25,
                    pl: 1.5,
                    pr: 2.5,
                  }}
                >
                  EGP {row.netAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// 8. Generate Custom Report Form
interface ReportGeneratorProps {
  t: (key: string) => string;
  theme: Theme;
  incRevenue: boolean;
  setIncRevenue: (val: boolean) => void;
  incBookings: boolean;
  setIncBookings: (val: boolean) => void;
  incPayments: boolean;
  setIncPayments: (val: boolean) => void;
  incSuppliers: boolean;
  setIncSuppliers: (val: boolean) => void;
  handleExportPrint: () => void;
}

function ReportGenerator({
  t,
  theme,
  incRevenue,
  setIncRevenue,
  incBookings,
  setIncBookings,
  incPayments,
  setIncPayments,
  incSuppliers,
  setIncSuppliers,
  handleExportPrint,
}: Readonly<ReportGeneratorProps>) {
  return (
    <Card
      dir={theme.direction === "rtl" ? "rtl" : "ltr"}
      sx={{
        height: "100%",
        boxShadow: theme.palette.shadow.card,
        borderRadius: 2,
        border: `1px solid ${theme.palette.border.light}`,
        textAlign: theme.direction === "rtl" ? "right" : "left",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, color: "text.primary", mb: 2.5, fontSize: "0.95rem" }}>
            {t("generateCustomReport")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={incRevenue}
                  onChange={e => {
                    setIncRevenue(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeRevenue")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incBookings}
                  onChange={e => {
                    setIncBookings(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeBookings")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incPayments}
                  onChange={e => {
                    setIncPayments(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includePayments")}</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={incSuppliers}
                  onChange={e => {
                    setIncSuppliers(e.target.checked);
                  }}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{t("includeSuppliers")}</Typography>}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleExportPrint}
          disabled={!incRevenue && !incBookings && !incPayments && !incSuppliers}
          sx={{
            borderRadius: 2,
            py: 1.25,
            mt: 3,
            fontSize: "0.78rem",
            fontWeight: 800,
            boxShadow: theme.palette.shadow.button,
            "&:hover": {
              boxShadow: theme.palette.shadow.buttonHover,
            },
          }}
        >
          {t("exportPdf")}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Main Container Component ---

export default function FinancialReportsClient({
  initialData,
  accessToken,
  locale,
}: Readonly<FinancialReportsClientProps>) {
  const theme = useTheme();
  const isRtl = locale === "ar";
  const t = useTranslations("dashboardAdmin.financialReports");

  const [data, setData] = useState<FinancialReportsData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    data ? null : "Failed to load financial reports data. Please try again."
  );

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Generation States
  const [incRevenue, setIncRevenue] = useState(true);
  const [incBookings, setIncBookings] = useState(true);
  const [incPayments, setIncPayments] = useState(true);
  const [incSuppliers, setIncSuppliers] = useState(true);

  const handleUpdateFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", new Date(startDate).toISOString());
      if (endDate) queryParams.append("endDate", new Date(endDate).toISOString());

      const res = await apiFetchJson<FinancialReportsData>(
        `/api/dashboard/financial-reports?${queryParams.toString()}`,
        {
          method: "GET",
          accessToken,
        }
      );
      setData(res);
    } catch (err) {
      logger.error("Failed to fetch filtered financial report", err);
      setError("Failed to update financial reports. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchJson<FinancialReportsData>(`/api/dashboard/financial-reports`, {
        method: "GET",
        accessToken,
      });
      setData(res);
    } catch (err) {
      logger.error("Failed to retry fetching financial reports", err);
      setError("Failed to fetch financial reports. Please check your connection or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPrint = () => {
    if (!incRevenue && !incBookings && !incPayments && !incSuppliers) {
      return;
    }
    window.print();
  };

  if (!data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          gap: 3,
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Typography color="error" variant="h6" sx={{ fontSize: "1rem" }}>
              {error || "No data available."}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                void handleRetry();
              }}
              sx={{ fontSize: "0.8rem", borderRadius: 1.5 }}
            >
              {t("updateFilter")}
            </Button>
          </>
        )}
      </Box>
    );
  }

  // Pre-calculate Donut Colors from theme
  const donutColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.status.active.main,
    theme.palette.status.confirmed.main,
  ];

  return (
    <Box dir={isRtl ? "rtl" : "ltr"} sx={{ pb: 4 }}>
      {/* Printable CSS Hook */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            width: 100%;
            direction: ${isRtl ? "rtl" : "ltr"};
          }
          .no-print {
            display: none !important;
          }
          .print-stack {
            width: 100% !important;
            max-width: 100% !important;
            flex-basis: 100% !important;
          }
        }
      `,
        }}
      />

      {/* Page Header */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}
        className="no-print"
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: "text.primary", mb: 0.5, fontSize: { xs: "1.45rem", sm: "1.65rem" } }}
          >
            {t("title")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {t("subtitle")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            bgcolor: "background.paper",
            p: 1,
            px: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.border.main}`,
          }}
        >
          <TextField
            type="date"
            label={t("dateFrom")}
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": {
                fontSize: "0.75rem",
                borderRadius: 1.5,
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
          />
          <TextField
            type="date"
            label={t("dateTo")}
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": {
                fontSize: "0.75rem",
                borderRadius: 1.5,
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              void handleUpdateFilter();
            }}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.75,
              fontSize: "0.75rem",
              fontWeight: 700,
              boxShadow: theme.palette.shadow.button,
              "&:hover": {
                boxShadow: theme.palette.shadow.buttonHover,
              },
            }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : t("updateFilter")}
          </Button>
        </Box>
      </Box>

      {/* Main Print Container */}
      <Box id="print-area">
        {/* Metric Cards Grid */}
        <Box className={!incRevenue ? "no-print" : ""}>
          <FinancialMetricCards data={data} isRtl={isRtl} t={t} theme={theme} />
        </Box>

        {/* Middle Section: Booking Summary, Revenue Chart & Payment Methods */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Booking Summary Table */}
          <Grid size={{ xs: 12, lg: 4 }} className={`${!incBookings ? "no-print" : ""} print-stack`}>
            <BookingSummaryTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Monthly Revenue Chart */}
          <Grid size={{ xs: 12, md: 6, lg: 5 }} className={`${!incRevenue ? "no-print" : ""} print-stack`}>
            <MonthlyRevenueChart data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Payment Methods Chart */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }} className={`${!incPayments ? "no-print" : ""} print-stack`}>
            <PaymentMethodsChart data={data} isRtl={isRtl} t={t} theme={theme} donutColors={donutColors} />
          </Grid>
        </Grid>

        {/* Lower Section: Recent Payments & Top Vehicles */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Payments */}
          <Grid size={{ xs: 12, lg: 7 }} className={`${!incPayments ? "no-print" : ""} print-stack`}>
            <RecentPaymentsTable data={data} isRtl={isRtl} t={t} theme={theme} locale={locale} />
          </Grid>

          {/* Top Revenue Vehicles */}
          <Grid size={{ xs: 12, lg: 5 }} className={`${!incRevenue ? "no-print" : ""} print-stack`}>
            <TopVehiclesTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>
        </Grid>

        {/* Bottom Section: Supplier Earnings & Report Generator */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Supplier Earnings */}
          <Grid size={{ xs: 12, lg: 8 }} className={`${!incSuppliers ? "no-print" : ""} print-stack`}>
            <SupplierEarningsTable data={data} isRtl={isRtl} t={t} theme={theme} />
          </Grid>

          {/* Generate Custom Report Form */}
          <Grid size={{ xs: 12, lg: 4 }} className="no-print">
            <ReportGenerator
              t={t}
              theme={theme}
              incRevenue={incRevenue}
              setIncRevenue={setIncRevenue}
              incBookings={incBookings}
              setIncBookings={setIncBookings}
              incPayments={incPayments}
              setIncPayments={setIncPayments}
              incSuppliers={incSuppliers}
              setIncSuppliers={setIncSuppliers}
              handleExportPrint={handleExportPrint}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
