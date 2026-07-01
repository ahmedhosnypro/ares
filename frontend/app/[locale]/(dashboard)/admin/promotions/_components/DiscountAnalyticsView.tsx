"use client";

import {
  Box,
  Typography,
  Card,
  Stack,
  Avatar,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  LocalOfferTwoTone as OfferIcon,
  PeopleTwoTone as PeopleIcon,
  AttachMoneyTwoTone as MoneyIcon,
  TrendingUpTwoTone as TrendingIcon,
  ShowChartTwoTone as ChartIcon,
  PersonAddTwoTone as PersonAddIcon,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";
import { formatCurrency } from "@/utils/currency-helpers";
import type { DiscountAnalyticsResponse } from "@/api-clients/promotions/promotions";

interface DiscountAnalyticsViewProps {
  readonly analytics: DiscountAnalyticsResponse;
}

export default function DiscountAnalyticsView({ analytics }: DiscountAnalyticsViewProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.promotions");
  const locale = useLocale();

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatROI = (value: number) => `${value.toFixed(1)}x`;

  const stats = [
    {
      icon: <OfferIcon fontSize="small" />,
      label: t("analyticsTotalUses"),
      value: String(analytics.totalUses),
      color: "primary",
    },
    {
      icon: <PeopleIcon fontSize="small" />,
      label: t("analyticsUniqueCustomers"),
      value: String(analytics.uniqueCustomers),
      color: "info",
    },
    {
      icon: <MoneyIcon fontSize="small" />,
      label: t("analyticsRevenue"),
      value: formatCurrency(analytics.totalRevenue),
      color: "success",
    },
    {
      icon: <TrendingIcon fontSize="small" />,
      label: t("analyticsTotalDiscount"),
      value: formatCurrency(analytics.totalDiscount),
      color: "warning",
    },
    {
      icon: <ChartIcon fontSize="small" />,
      label: t("analyticsConversionRate"),
      value: formatPercent(analytics.conversionRate),
      color: "secondary",
    },
    {
      icon: <TrendingIcon fontSize="small" />,
      label: t("analyticsROI"),
      value: formatROI(analytics.roi),
      color: "primary",
    },
    {
      icon: <PersonAddIcon fontSize="small" />,
      label: t("analyticsNewCustomers"),
      value: String(analytics.newCustomers),
      color: "success",
    },
  ];

  const resolvePaletteColor = (color: string) => {
    const isPaletteColor = color in theme.palette;
    return isPaletteColor ? (theme.palette[color as keyof typeof theme.palette] as { main: string }).main : color;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {t("analyticsTitle")}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {stats.map(card => {
          const mainColor = resolvePaletteColor(card.color);
          return (
            <Card
              key={card.label}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mainColor, 0.08)} 100%)`,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -18,
                  right: -18,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: alpha(mainColor, 0.1),
                }}
              />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, width: 40, height: 40 }}>
                  {card.icon}
                </Avatar>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                    noWrap
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: mainColor,
                      lineHeight: 1.1,
                    }}
                    noWrap
                  >
                    {card.value}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Box>

      {analytics.usageTimeline.length > 0 && (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: () => alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Uses
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Revenue
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Discount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.usageTimeline.map(entry => (
                <TableRow
                  key={entry.date}
                  sx={{
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                    transition: "background 0.15s",
                  }}
                >
                  <TableCell>{formatUtcDate(entry.date, locale)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {entry.uses}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(entry.discountAmount)}</TableCell>
                  <TableCell align="right" sx={{ color: "warning.main", fontWeight: 600 }}>
                    {formatCurrency(entry.discountAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
