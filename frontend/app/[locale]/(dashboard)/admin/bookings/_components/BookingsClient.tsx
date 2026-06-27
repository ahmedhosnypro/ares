"use client";

import React, { useState, useMemo } from "react";
import {
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  SearchRounded as SearchIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PersonOutlineTwoTone as PersonIcon,
  MoreVertRounded as MoreVertIcon,
  LocalOfferTwoTone as PriceIcon,
  CreditCardTwoTone as PaymentIcon,
  AddRounded as AddIcon,
  LaunchOutlined as ViewIcon,
  EditOutlined as EditIcon,
  SyncAltOutlined as ChangeStatusIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  useBookings,
  useAdminBookingAnalytics,
  type Booking,
  deleteBookings as deleteBookingsApi,
} from "@/api-clients/bookings/bookings";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

import ChangeStatusModal from "./ChangeStatusModal";
import BookingsAnalytics from "./BookingsAnalytics";

// ── CONSTANTS & HELPERS ─────────────────────────────────────────────────
const getStatusConfig = (status?: string, t?: (key: string) => string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "active" || s === "confirmed" || s === "pickup")
    return { label: t ? t("filters.statuses.active") : (status ?? "Active"), colorKey: "success" as const };
  if (s === "completed")
    return { label: t ? t("filters.statuses.completed") : (status ?? "Completed"), colorKey: "info" as const };
  if (s === "cancelled" || s === "returned")
    return { label: t ? t("filters.statuses.cancelled") : (status ?? "Cancelled"), colorKey: "error" as const };
  if (s === "draft")
    return { label: t ? t("filters.statuses.draft") : (status ?? "Draft"), colorKey: "warning" as const };
  return {
    label: t ? t("filters.statuses.paymentPending") : (status ?? "PaymentPending"),
    colorKey: "warning" as const,
  };
};

const getPaymentStatusConfig = (status?: string, t?: (key: string) => string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "captured" || s === "paid" || s === "succeeded")
    return { label: t ? t("paymentStatuses.captured") : (status ?? "Captured"), colorKey: "success" as const };
  if (s === "refunded")
    return { label: t ? t("paymentStatuses.refunded") : (status ?? "Refunded"), colorKey: "error" as const };
  if (s === "failed")
    return { label: t ? t("paymentStatuses.failed") : (status ?? "Failed"), colorKey: "error" as const };
  if (s === "pending" || s === "paymentpending")
    return { label: t ? t("paymentStatuses.pending") : (status ?? "Pending"), colorKey: "warning" as const };
  return { label: t ? t("paymentStatuses.unpaid") : "Unpaid", colorKey: null };
};

const formatCompactDate = (dateString: string) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

// ── MAIN PAGE COMPONENT ─────────────────────────────────────────────────
export default function BookingsClient() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.bookings");
  const tCommon = useTranslations("common");

  // Filters / paging
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Actions menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Change status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusBooking, setStatusBooking] = useState<{ id: string; status: string } | null>(null);
  const created = searchParams.get("created") === "1";
  const bookingNumber = searchParams.get("bookingNumber");

  // Local optimistic patch — after a successful status change, reflect the
  // new value in-table without waiting for the next refetch.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const user = useMemo(
    () => (session?.user ? { id: session.user.id, role: session.user.roles[0] || "Admin" } : undefined),
    [session?.user]
  );

  const { bookings, loading, totalPages, totalCount, refetch } = useBookings(
    session?.accessToken,
    user,
    page,
    size,
    search,
    statusFilter,
    fromDate ? new Date(fromDate).toISOString() : null,
    toDate ? new Date(toDate).toISOString() : null
  );

  const {
    analytics,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useAdminBookingAnalytics(session?.accessToken, user);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, booking: Booking) => {
    setAnchorEl(e.currentTarget);
    setActiveBooking(booking);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveBooking(null);
  };

  const handleViewDetails = () => {
    if (!activeBooking) return;
    router.push(`/admin/bookings/${activeBooking.id}`);
    handleCloseMenu();
  };

  const handleEdit = () => {
    if (!activeBooking) return;
    router.push(`/admin/bookings/${activeBooking.id}/edit`);
    handleCloseMenu();
  };

  const handleChangeStatus = () => {
    if (!activeBooking) return;
    setStatusBooking({ id: activeBooking.id, status: activeBooking.status });
    setStatusModalOpen(true);
    handleCloseMenu();
  };

  const handleDeleteClick = () => {
    if (!activeBooking) return;
    setDeleteId(activeBooking.id);
    setOpenDelete(true);
    handleCloseMenu();
  };

  const confirmDelete = () => {
    void (async () => {
      if (!deleteId || !session?.accessToken || isDeleting) return;
      setIsDeleting(true);
      try {
        await deleteBookingsApi(session.accessToken, [deleteId]);
        setOpenDelete(false);
        setDeleteId(null);

        // If we are deleting the only item on a page > 0, decrement page state
        if (bookings.length === 1 && page > 0) {
          setPage(page - 1);
        }

        // Refetch updated bookings list & stats
        refetch();
        refetchAnalytics();

        setSnackbar({
          open: true,
          message: t("alerts.deleteSuccess"),
          severity: "success",
        });
      } catch (error) {
        logger.error("Error deleting booking", error);
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : t("alerts.deleteError"),
          severity: "error",
        });
      } finally {
        setIsDeleting(false);
      }
    })();
  };

  // ── Renderers ────────────────────────────────────────────────────────
  const renderTableBody = () => {
    if (loading) {
      return [
        <TableRow key="loading">
          <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>,
      ];
    }

    if (bookings.length === 0) {
      return [
        <TableRow key="empty">
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
        </TableRow>,
      ];
    }

    return bookings.map((booking: Booking) => {
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
                {getInitials(booking.customerName ?? booking.customer?.fullName ?? "Unknown Customer")}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                  {booking.customerName ?? booking.customer?.fullName ?? "Unknown Customer"}
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
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{booking.car?.name ?? "Unknown Vehicle"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.car?.plateNumber ?? "No Plate"}
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
              {formatCompactDate(booking.from)} → {formatCompactDate(booking.to)}
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
                {booking.paymentMethod ?? "None"}
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
                ${(booking.price ?? 0).toFixed(2)}
              </Typography>
            </Stack>
          </TableCell>

          {/* Actions */}
          <TableCell align="right" sx={{ pr: 3 }}>
            <IconButton
              size="small"
              onClick={e => {
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
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 800 }}>
            {t("title")}
          </Typography>
          <Typography color="text.secondary">{t("subtitle")}</Typography>
        </Box>

        <Box
          component={Link}
          href="/admin/bookings/create"
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            color: "primary.contrastText",
            cursor: "pointer",
            textDecoration: "none",
            background: theme =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "0.2s",
            whiteSpace: "nowrap",
            alignSelf: { xs: "stretch", sm: "auto" },
            justifyContent: { xs: "center", sm: "flex-start" },
            "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
          }}
        >
          <AddIcon fontSize="small" />
          {t("newBooking")}
        </Box>
      </Stack>

      {created && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {t("alerts.createdSuccess", { bookingNumber: bookingNumber ? ` ${bookingNumber}` : "" })}
        </Alert>
      )}

      {/* ── ANALYTICS SECTION ── */}
      <BookingsAnalytics analytics={analytics} loading={analyticsLoading} />

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
            placeholder={t("filters.searchPlaceholder")}
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
            <InputLabel>{tCommon("status")}</InputLabel>
            <Select
              value={statusFilter}
              label={tCommon("status")}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">{t("filters.statuses.all")}</MenuItem>
              <MenuItem value="Draft">{t("filters.statuses.draft")}</MenuItem>
              <MenuItem value="PaymentPending">{t("filters.statuses.paymentPending")}</MenuItem>
              <MenuItem value="Confirmed">{t("filters.statuses.confirmed")}</MenuItem>
              <MenuItem value="Active">{t("filters.statuses.active")}</MenuItem>
              <MenuItem value="Completed">{t("filters.statuses.completed")}</MenuItem>
              <MenuItem value="Cancelled">{t("filters.statuses.cancelled")}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            label={t("filters.dateFrom")}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            type="date"
            label={t("filters.dateTo")}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={toDate}
            onChange={e => {
              setToDate(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
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
                          setPage(v - 1);
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

      {/* ── DELETE DIALOG ── */}
      <Dialog
        open={openDelete}
        onClose={() => {
          if (!isDeleting) setOpenDelete(false);
        }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1, minWidth: 350 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>
          {t("deleteDialog.content")}
          <br />
          <strong>{t("deleteDialog.subcontent")}</strong>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={isDeleting}
            onClick={() => {
              setOpenDelete(false);
            }}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 100 }}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : tCommon("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── ACTIONS MENU ── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180, boxShadow: theme.shadows[3] } } }}
      >
        <MenuItem onClick={handleViewDetails} sx={{ fontSize: 14, gap: 1.5 }}>
          <ViewIcon fontSize="small" />
          {t("menu.viewDetails")}
        </MenuItem>
        <MenuItem onClick={handleEdit} sx={{ fontSize: 14, gap: 1.5 }}>
          <EditIcon fontSize="small" />
          {t("menu.editBooking")}
        </MenuItem>
        <MenuItem onClick={handleChangeStatus} sx={{ fontSize: 14, gap: 1.5 }}>
          <ChangeStatusIcon fontSize="small" />
          {t("menu.changeStatus")}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ fontSize: 14, gap: 1.5, color: "error.main", fontWeight: 600 }}>
          <DeleteIcon fontSize="small" color="error" />
          {t("menu.deleteBooking")}
        </MenuItem>
      </Menu>

      {/* ── CHANGE STATUS MODAL ── */}
      <ChangeStatusModal
        open={statusModalOpen}
        bookingId={statusBooking?.id ?? null}
        currentStatus={statusBooking?.status ?? null}
        accessToken={session?.accessToken}
        onClose={() => {
          setStatusModalOpen(false);
          setStatusBooking(null);
        }}
        onSuccess={newStatus => {
          if (statusBooking) {
            setStatusOverrides(prev => ({ ...prev, [statusBooking.id]: newStatus }));
          }
        }}
      />

      {/* ── TOAST NOTIFICATIONS ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => {
          setSnackbar(prev => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setSnackbar(prev => ({ ...prev, open: false }));
          }}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
