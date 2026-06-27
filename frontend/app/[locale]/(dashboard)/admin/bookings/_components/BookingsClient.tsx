"use client";

import React, { useState, useMemo } from "react";
import { Box, Typography, Paper, Stack, Alert, Snackbar } from "@mui/material";
import { AddRounded as AddIcon } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  useBookings,
  useAdminBookingAnalytics,
  type Booking,
  type AdminBookingAnalytics,
  deleteBookings as deleteBookingsApi,
} from "@/api-clients/bookings/bookings";
import { logger } from "@/utils/logger";

import ChangeStatusModal from "./ChangeStatusModal";
import BookingsAnalytics from "./BookingsAnalytics";
import BookingsFilterBar from "./BookingsFilterBar";
import BookingsTable from "./BookingsTable";
import DeleteBookingDialog from "./DeleteBookingDialog";
import BookingActionsMenu from "./BookingActionsMenu";

interface BookingsClientProps {
  readonly initialBookings?: {
    bookings: Booking[];
    totalCount: number;
    totalPages: number;
  };
  readonly initialAnalytics?: AdminBookingAnalytics;
}

export default function BookingsClient({ initialBookings, initialAnalytics }: BookingsClientProps) {
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

  // Local optimistic patch
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
    toDate ? new Date(toDate).toISOString() : null,
    initialBookings
  );

  const {
    analytics,
    loading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useAdminBookingAnalytics(session?.accessToken, user, initialAnalytics);

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
        <BookingsFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={status => {
            setStatusFilter(status);
            setPage(0);
          }}
          fromDate={fromDate}
          onFromDateChange={date => {
            setFromDate(date);
            setPage(0);
          }}
          toDate={toDate}
          onToDateChange={date => {
            setToDate(date);
            setPage(0);
          }}
          t={t}
          tCommon={tCommon}
        />

        {/* Table */}
        <BookingsTable
          bookings={bookings}
          loading={loading}
          totalPages={totalPages}
          totalCount={totalCount}
          page={page}
          onPageChange={setPage}
          statusOverrides={statusOverrides}
          onOpenMenu={handleOpenMenu}
          t={t}
          tCommon={tCommon}
        />
      </Paper>

      {/* ── DELETE DIALOG ── */}
      <DeleteBookingDialog
        open={openDelete}
        isDeleting={isDeleting}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        t={t}
        tCommon={tCommon}
      />

      {/* ── ACTIONS MENU ── */}
      <BookingActionsMenu
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatus}
        onDelete={handleDeleteClick}
        t={t}
      />

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
