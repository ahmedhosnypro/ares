"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  InputAdornment,
  Pagination,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  SearchRounded as SearchIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  MoreVertRounded as MoreVertIcon,
  LocalOfferTwoTone as PriceIcon,
  CreditCardTwoTone as PaymentIcon,
  LaunchOutlined as ViewIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  useSupplierBookings,
  type SupplierBookingListItemDto,
} from "@/api-clients/supplier-bookings/supplier-bookings";
import { toImageUrl } from "@/utils/image-url";

// ── CONSTANTS & HELPERS ─────────────────────────────────────────────────
type TFunction = (key: string) => string;

const getStatusConfig = (status: string | undefined, t: TFunction) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "active" || s === "pickup")
    return { label: t("filters.bookingStatusOptions.active"), colorPalette: "active" as const };
  if (s === "confirmed")
    return { label: t("filters.bookingStatusOptions.confirmed"), colorPalette: "confirmed" as const };
  if (s === "completed") return { label: t("statusLabels.completed"), colorPalette: "completed" as const };
  if (s === "cancelled" || s === "returned")
    return { label: t("statusLabels.cancelled"), colorPalette: "cancelled" as const };
  if (s === "draft") return { label: t("statusLabels.draft"), colorPalette: "pending" as const };
  return { label: t("statusLabels.paymentPending"), colorPalette: "pendingApproval" as const };
};

const getPaymentStatusLabel = (status: string | undefined | null, t: TFunction): string => {
  const s = status?.toLowerCase() ?? "";
  if (s === "pending") return t("filters.paymentStatusOptions.pending");
  if (s === "authorized") return t("filters.paymentStatusOptions.authorized");
  if (s === "captured" || s === "paid") return t("filters.paymentStatusOptions.captured");
  if (s === "failed") return t("filters.paymentStatusOptions.failed");
  if (s === "refunded") return t("filters.paymentStatusOptions.refunded");
  return status ?? t("paymentDefault");
};

const formatCompactDate = (dateString?: string) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/**
 * Short-form id for the "#XXXXX" hint under the customer name. Falls back
 * gracefully if both the booking number and id are missing so we never
 * render bare "#" or crash on `id.split("-")`.
 */
const shortBookingRef = (booking: { bookingNumber?: string; id: string }) => {
  if (booking.bookingNumber && booking.bookingNumber.trim().length > 0) {
    return booking.bookingNumber;
  }
  if (booking.id) {
    const [head] = booking.id.split("-");
    if (head && head.length > 0) return head;
  }
  return "—";
};

// ── MAIN PAGE COMPONENT ─────────────────────────────────────────────────
export default function SupplierBookingsClient() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboard.supplierBookings");
  const tc = useTranslations("common");

  // Filters / paging
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [page, setPage] = useState(1);
  const size = 10;

  // Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeBooking, setActiveBooking] = useState<SupplierBookingListItemDto | null>(null);

  const { bookings, loading, error, totalPages, totalCount } = useSupplierBookings(
    session?.accessToken,
    page,
    size,
    search,
    statusFilter,
    paymentFilter
  );

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, booking: SupplierBookingListItemDto) => {
    setAnchorEl(e.currentTarget);
    setActiveBooking(booking);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveBooking(null);
  };

  const handleViewDetails = () => {
    if (!activeBooking) return;
    router.push(`/supplier/bookings/${activeBooking.id}`);
    handleCloseMenu();
  };

  // ── Renderers ────────────────────────────────────────────────────────
  const renderTableBody = (): React.ReactNode => {
    if (loading) {
      return [
        <TableRow key="loading">
          <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>,
      ];
    }

    if (error) {
      return [
        <TableRow key="error">
          <TableCell colSpan={8} sx={{ py: 4 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </TableCell>
        </TableRow>,
      ];
    }

    if (bookings.length === 0) {
      return [
        <TableRow key="empty">
          <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
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
                {t("empty.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("empty.description")}
              </Typography>
            </Box>
          </TableCell>
        </TableRow>,
      ];
    }

    return bookings.map((booking: SupplierBookingListItemDto) => {
      const statusConfig = getStatusConfig(booking.bookingStatus, t);
      const statusColor = theme.palette.status[statusConfig.colorPalette].main;
      const customerLabel =
        booking.customerName && booking.customerName.trim().length > 0 ? booking.customerName : t("customerDefault");

      return (
        <TableRow
          key={booking.id}
          hover
          sx={{
            transition: "background 0.15s",
            "&:last-child td": { border: 0 },
            "&:hover": { bgcolor: theme => alpha(theme.palette.primary.main, 0.03) },
            cursor: booking.id ? "pointer" : "default",
          }}
          onClick={() => {
            if (booking.id) router.push(`/supplier/bookings/${booking.id}`);
          }}
        >
          {/* Booking / Customer */}
          <TableCell sx={{ pl: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{customerLabel}</Typography>
              <Typography variant="caption" color="text.secondary">
                #{shortBookingRef(booking)}
              </Typography>
            </Box>
          </TableCell>

          {/* Vehicle */}
          <TableCell>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                variant="rounded"
                src={toImageUrl(booking.vehicleImageUrl)}
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
                  {booking.vehicleMake} {booking.vehicleModel}
                </Typography>
              </Box>
            </Stack>
          </TableCell>

          {/* Period — compact */}
          <TableCell>
            <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>
              {formatCompactDate(booking.pickupDate)} → {formatCompactDate(booking.returnDate)}
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

          {/* Payment */}
          <TableCell>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <PaymentIcon
                sx={{
                  fontSize: 14,
                  color:
                    booking.paymentStatus?.toLowerCase() === "captured" ||
                    booking.paymentStatus?.toLowerCase() === "paid"
                      ? "success.main"
                      : "text.secondary",
                }}
              />
              <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
                {getPaymentStatusLabel(booking.paymentStatus, t)}
              </Typography>
            </Stack>
          </TableCell>

          {/* Total */}
          <TableCell>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <PriceIcon sx={{ fontSize: 14, color: "success.main" }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                ${(booking.totalPrice ?? 0).toFixed(2)}
              </Typography>
            </Stack>
          </TableCell>

          {/* Created At */}
          <TableCell>
            <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
              {formatCompactDate(booking.createdAt)}
            </Typography>
          </TableCell>

          {/* Actions */}
          <TableCell align="right" sx={{ pr: 3 }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                handleOpenMenu(e, booking);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* ── HEADER ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 800 }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary">{t("subtitle")}</Typography>
        </Box>
      </Stack>

      {/* ── SEARCH & TABLE SECTION ── */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {/* Filter Bar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            alignItems: { md: "center" },
          }}
        >
          <TextField
            placeholder={t("search.placeholder")}
            value={search}
            onChange={handleSearchChange}
            size="small"
            sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("filters.bookingStatus")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("filters.bookingStatus")}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">{t("filters.allStatuses")}</MenuItem>
              <MenuItem value="Draft">{t("filters.bookingStatusOptions.draft")}</MenuItem>
              <MenuItem value="PaymentPending">{t("filters.bookingStatusOptions.paymentPending")}</MenuItem>
              <MenuItem value="Confirmed">{t("filters.bookingStatusOptions.confirmed")}</MenuItem>
              <MenuItem value="Active">{t("filters.bookingStatusOptions.active")}</MenuItem>
              <MenuItem value="Completed">{t("filters.bookingStatusOptions.completed")}</MenuItem>
              <MenuItem value="Cancelled">{t("filters.bookingStatusOptions.cancelled")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("filters.paymentStatus")}</InputLabel>
            <Select
              value={paymentFilter}
              label={t("filters.paymentStatus")}
              onChange={e => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">{t("filters.allStatuses")}</MenuItem>
              <MenuItem value="Pending">{t("filters.paymentStatusOptions.pending")}</MenuItem>
              <MenuItem value="Authorized">{t("filters.paymentStatusOptions.authorized")}</MenuItem>
              <MenuItem value="Captured">{t("filters.paymentStatusOptions.captured")}</MenuItem>
              <MenuItem value="Failed">{t("filters.paymentStatusOptions.failed")}</MenuItem>
              <MenuItem value="Refunded">{t("filters.paymentStatusOptions.refunded")}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
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
                <TableCell sx={{ pl: 3 }}>{t("table.customer")}</TableCell>
                <TableCell>{t("table.vehicle")}</TableCell>
                <TableCell>{t("table.period")}</TableCell>
                <TableCell>{tc("status")}</TableCell>
                <TableCell>{t("table.payment")}</TableCell>
                <TableCell>{t("table.total")}</TableCell>
                <TableCell>{t("table.created")}</TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  {tc("actions")}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>{renderTableBody()}</TableBody>

            {!loading && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t("footer.showingPage", { page, totalPages: totalPages || 1, totalCount })}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={4} align="right">
                    {totalPages > 1 && (
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, v) => {
                          setPage(v);
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
      </Paper>

      {/* ── ACTIONS MENU ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180, boxShadow: theme.shadows[3] } } }}
      >
        <MenuItem onClick={handleViewDetails} sx={{ fontSize: 14, gap: 1.5 }}>
          <ViewIcon fontSize="small" />
          {t("actions.viewDetails")}
        </MenuItem>
      </Menu>
    </Box>
  );
}
