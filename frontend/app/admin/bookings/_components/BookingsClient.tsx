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
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Stack,
  CircularProgress,
  InputAdornment,
  Pagination,
  Tooltip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  SearchRounded as SearchIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PersonOutlineTwoTone as PersonIcon,
  LocationOnTwoTone as LocationIcon,
  DateRangeTwoTone as DateIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBookings, type Booking } from "@/api-clients/bookings/bookings";
import { apiFetchJson } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

// ── CONSTANTS & HELPERS ──
const getStatusConfig = (status?: string) => {
  const s = status?.toLowerCase() || "";
  // Map various status strings to color schemes
  if (s === "confirmed" || s === "active" || s === "pickup") 
    return { label: status || "Confirmed", colorKey: "success" as const };
  if (s === "completed") 
    return { label: status || "Completed", colorKey: "info" as const };
  if (s === "cancelled" || s === "returned") 
    return { label: status || "Cancelled", colorKey: "error" as const };
  return { label: status || "Pending", colorKey: "warning" as const };
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ── MAIN PAGE COMPONENT ──
export default function BookingsClient() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();

  // States
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // ضفنا State عشان الـ Loading بتاع الحذف

  // استخراج اليوزر من الجلسة - useMemo prevents a new object reference on every render
  const user = useMemo(
    () => (session?.user ? { id: session.user.id, role: session.user.roles[0] || "Admin" } : undefined),
    [session?.user]
  );

  // Fetch Data using our custom hook
  const { bookings, loading, totalPages, totalCount } = useBookings(session?.accessToken, user, page, size, search);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page on search
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  // 🚀 الفانكشن الحقيقية للحذف بناءً على سويجر
  const confirmDelete = async () => {
    if (!deleteId || !session?.accessToken) return;

    setIsDeleting(true);
    try {
      // بنبعت الـ ID جوه مصفوفة زي ما الباك إند طالب
      await apiFetchJson(`/api/admin/bookings/delete-bookings`, {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({ ids: [deleteId] }),
      });

      // نقفل المودال بعد النجاح
      setOpenDelete(false);
      setDeleteId(null);

      // نعمل ريفريش للصفحة عشان الداتا الجديدة (بدون الحجز اللي اتمسح) تظهر
      window.location.reload();
    } catch (error) {
      logger.error("Error deleting booking", error);
      alert("Failed to delete the booking. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      );
    }

    if (bookings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
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
                No bookings found
              </Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {bookings.map((booking: Booking) => {
          const statusConfig = getStatusConfig(booking.status);
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
              {/* Vehicle & Driver */}
              <TableCell sx={{ pl: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar
                    variant="rounded"
                    src={toImageUrl(booking.car?.image)}
                    sx={{
                      width: 45,
                      height: 45,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <CarIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      {booking.car?.name || "Unknown Vehicle"}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {booking.driver?.fullName || "No Driver"}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </TableCell>

              {/* Locations */}
              <TableCell>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <LocationIcon sx={{ fontSize: 14, color: "success.main" }} />
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {booking.pickupLocation?.name || "-"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <LocationIcon sx={{ fontSize: 14, color: "error.main" }} />
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {booking.dropOffLocation?.name || "-"}
                    </Typography>
                  </Stack>
                </Stack>
              </TableCell>

              {/* Dates */}
              <TableCell>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <DateIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {formatDate(booking.from)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <DateIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {formatDate(booking.to)}
                    </Typography>
                  </Stack>
                </Stack>
              </TableCell>

              {/* Status & Payment */}
              <TableCell>
                <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{
                      textTransform: "capitalize",
                      borderRadius: 2,
                      bgcolor: alpha(statusColor, 0.15),
                      color: statusColor,
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                  {booking.payLater && (
                    <Chip label="Pay Later" size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                  )}
                </Stack>
              </TableCell>

              {/* Actions */}
              <TableCell align="right" sx={{ pr: 3 }}>
                <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                  <Tooltip title="Edit Status">
                    <IconButton
                      size="small"
                      onClick={() => {
                        router.push(`/admin/bookings/${booking.id}/edit`);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Booking">
                    <IconButton
                      size="small"
                      onClick={() => {
                        handleDeleteClick(booking.id);
                      }}
                      sx={{
                        borderRadius: 2,
                        "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  };
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1300, mx: "auto" }}>
      {/* ── HEADER ── */}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, gap: 2, justifyContent: "space-between", mb: 4 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", sm: "2rem" }, fontWeight: 800 }}>
            Bookings Management
          </Typography>
          <Typography color="text.secondary">Monitor and manage all ARES reservations</Typography>
        </Box>

        <Box
          onClick={() => {
            router.push("/admin/bookings/create");
          }}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: 3,
            fontWeight: 700,
            color: "primary.contrastText",
            cursor: "pointer",
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
          New Booking
        </Box>
      </Stack>

      {/* ── SEARCH & TABLE SECTION ── */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        {/* Filter Bar */}
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by keyword..."
            value={search}
            onChange={handleSearchChange}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "background.paper" } }}
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
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
                  "& .MuiTableCell-head": {
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 1.5,
                  },
                }}
              >
                <TableCell sx={{ pl: 3 }}>Vehicle & Driver</TableCell>
                <TableCell>Location (Pick/Drop)</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Status & Payment</TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </TableContainer>

        {/* ── PAGINATION FOOTER ── */}
        {!loading && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              alignItems: "center",
              borderTop: "1px solid",
              borderColor: "divider",
              gap: 1,
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing page <strong>{page + 1}</strong> of {totalPages || 1} ({totalCount} total)
            </Typography>
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
          </Stack>
        )}
      </Paper>

      {/* ── DELETE DIALOG ── */}
      <Dialog
        open={openDelete}
        onClose={() => {
          if (!isDeleting) setOpenDelete(false);
        }}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, minWidth: 350 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Booking</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this booking?
          <br />
          <strong>This action cannot be undone.</strong>
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
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => {
              void confirmDelete();
            }}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 100 }}
          >
            {isDeleting ? <CircularProgress size={24} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
