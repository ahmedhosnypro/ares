"use client";

import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  Pagination,
  useTheme,
  alpha,
} from "@mui/material";
import {
  SearchRounded as SearchIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PersonOutlineTwoTone as PersonIcon,
  MoreVertRounded as MoreVertIcon,
  LocalOfferTwoTone as PriceIcon,
  CreditCardTwoTone as PaymentIcon,
} from "@mui/icons-material";
import type { Booking } from "@/api-clients/bookings/bookings";
import { toImageUrl } from "@/utils/image-url";
import { useTranslations } from "next-intl";
import { formatUtcDate } from "@/utils/dateTime";

interface BookingsTableProps {
  readonly bookings: readonly Booking[];
  readonly loading: boolean;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly page: number;
  readonly onPageChange: (page: number) => void;
  readonly statusOverrides: Record<string, string>;
  readonly onOpenMenu: (e: React.MouseEvent<HTMLElement>, booking: Booking) => void;
  readonly t: ReturnType<typeof useTranslations>;
  readonly tCommon: ReturnType<typeof useTranslations>;
  readonly locale: string;
}

const STATUS_MAP: Record<string, { key: string; colorKey: "success" | "info" | "error" | "warning" }> = {
  active: { key: "filters.statuses.active", colorKey: "success" },
  confirmed: { key: "filters.statuses.active", colorKey: "success" },
  pickup: { key: "filters.statuses.active", colorKey: "success" },
  completed: { key: "filters.statuses.completed", colorKey: "info" },
  cancelled: { key: "filters.statuses.cancelled", colorKey: "error" },
  returned: { key: "filters.statuses.cancelled", colorKey: "error" },
  rejected: { key: "filters.statuses.rejected", colorKey: "error" },
  draft: { key: "filters.statuses.draft", colorKey: "warning" },
  pendingapproval: { key: "filters.statuses.pendingApproval", colorKey: "warning" },
};

const getStatusConfig = (status: string | undefined, t: (key: string) => string) => {
  const s = status?.toLowerCase() ?? "";
  const entry = STATUS_MAP[s] as { key: string; colorKey: "success" | "info" | "error" | "warning" } | undefined;
  return entry
    ? { label: t(entry.key), colorKey: entry.colorKey }
    : { label: t("filters.statuses.paymentPending"), colorKey: "warning" as const };
};

const getPaymentStatusConfig = (status: string | undefined, t: (key: string) => string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "captured" || s === "paid" || s === "succeeded")
    return { label: t("paymentStatuses.captured"), colorKey: "success" as const };
  if (s === "refunded") return { label: t("paymentStatuses.refunded"), colorKey: "error" as const };
  if (s === "failed") return { label: t("paymentStatuses.failed"), colorKey: "error" as const };
  if (s === "pending" || s === "paymentpending")
    return { label: t("paymentStatuses.pending"), colorKey: "warning" as const };
  return { label: t("paymentStatuses.unpaid"), colorKey: null };
};

const formatCompactDate = (dateString: string, locale: string) => {
  if (!dateString) return "—";
  return formatUtcDate(dateString, locale, { month: "short", day: "numeric" }, "—");
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

export default function BookingsTable({
  bookings,
  loading,
  totalPages,
  totalCount,
  page,
  onPageChange,
  statusOverrides,
  onOpenMenu,
  t,
  tCommon,
  locale,
}: BookingsTableProps) {
  const theme = useTheme();

  const renderTableBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      );
    }

    if (bookings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
            <Box sx={{ textAlign: "center", opacity: 0.6 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  bgcolor: theme => alpha(theme.palette.text.disabled, 0.1),
                }}
              >
                <SearchIcon sx={{ fontSize: 32, color: "text.disabled" }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                {t("table.empty.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("table.empty.description")}
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {bookings.map((booking: Booking) => {
          const effectiveStatus = statusOverrides[booking.id] ?? booking.status;
          const statusConfig = getStatusConfig(effectiveStatus, t);
          const statusColor = theme.palette[statusConfig.colorKey].main;

          return (
            <TableRow
              key={booking.id}
              hover
              sx={{
                transition: "background 0.15s",
                "&:last-child td": { border: 0 },
                "&:hover": { bgcolor: theme => alpha(theme.palette.primary.main, 0.03) },
              }}
            >
              {/* Booking */}
              <TableCell sx={{ pl: 3 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {getInitials(
                      booking.customerName ?? booking.customer?.fullName ?? t("table.fallbacks.unknownCustomer")
                    )}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      {booking.customerName ?? booking.customer?.fullName ?? t("table.fallbacks.unknownCustomer")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      #{booking.bookingNumber ?? booking.id.split("-")[0]}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>

              {/* Vehicle */}
              <TableCell>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar
                    variant="rounded"
                    src={toImageUrl(booking.car?.image)}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <CarIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {booking.car?.name ?? t("table.fallbacks.unknownVehicle")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.car?.plateNumber ?? t("table.fallbacks.noPlate")}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>

              {/* Supplier */}
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" noWrap>
                    {booking.supplier?.name ?? booking.supplier?.fullName ?? "—"}
                  </Typography>
                </Stack>
              </TableCell>

              {/* Period — compact */}
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
                  {formatCompactDate(booking.from, locale)} → {formatCompactDate(booking.to, locale)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.totalDays ? t("table.daysCount", { count: booking.totalDays }) : "—"}
                </Typography>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Chip
                  label={statusConfig.label}
                  size="small"
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: 1.5,
                    bgcolor: alpha(statusColor, 0.15),
                    color: statusColor,
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
              </TableCell>

              {/* Payment Method */}
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <PaymentIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>
                    {booking.paymentMethod ?? t("table.fallbacks.noPaymentMethod")}
                  </Typography>
                </Stack>
              </TableCell>

              {/* Payment Status */}
              <TableCell>
                {(() => {
                  const statusConfig = getPaymentStatusConfig(booking.paymentStatus, t);
                  if (statusConfig.colorKey === null) {
                    return (
                      <Chip
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          textTransform: "capitalize",
                          borderRadius: 1.5,
                          bgcolor: "transparent",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: 11,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    );
                  }
                  const colorVal = theme.palette[statusConfig.colorKey].main;
                  return (
                    <Chip
                      label={statusConfig.label}
                      size="small"
                      sx={{
                        textTransform: "capitalize",
                        borderRadius: 1.5,
                        bgcolor: alpha(colorVal, 0.15),
                        color: colorVal,
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    />
                  );
                })()}
              </TableCell>

              {/* Total */}
              <TableCell>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <PriceIcon sx={{ fontSize: 14, color: "success.main" }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {t("table.fallbacks.currencySymbol")}
                    {(booking.price ?? 0).toFixed(2)}
                  </Typography>
                </Stack>
              </TableCell>

              {/* Actions */}
              <TableCell align="right" sx={{ pr: 3 }}>
                <IconButton
                  size="small"
                  onClick={e => {
                    onOpenMenu(e, booking);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  };

  return (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow
            sx={{
              "& .MuiTableCell-head": {
                fontWeight: 700,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "text.secondary",
                borderBottom: "1px solid",
                borderColor: "divider",
                py: 2,
                bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
              },
            }}
          >
            <TableCell sx={{ pl: 3 }}>{t("table.headers.booking")}</TableCell>
            <TableCell>{t("table.headers.vehicle")}</TableCell>
            <TableCell>{t("table.headers.supplier")}</TableCell>
            <TableCell>{t("table.headers.period")}</TableCell>
            <TableCell>{t("table.headers.status")}</TableCell>
            <TableCell>{t("table.headers.paymentMethod")}</TableCell>
            <TableCell>{t("table.headers.paymentStatus")}</TableCell>
            <TableCell>{t("table.headers.total")}</TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>
              {tCommon("actions")}
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>{renderTableBody()}</TableBody>

        {!loading && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="caption" color="text.secondary">
                  {t.rich("table.pagination.showingPage", {
                    totalPages: totalPages || 1,
                    totalCount: totalCount,
                    strong: () => <strong>{page + 1}</strong>,
                  })}
                </Typography>
              </TableCell>
              <TableCell colSpan={4} align="right">
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, v) => {
                      onPageChange(v - 1);
                    }}
                    size="small"
                    sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                  />
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}
