"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Pagination,
  Checkbox,
} from "@mui/material";
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { apiFetchJson } from "@/utils/api-client";
import { useSession } from "next-auth/react";
import { logger } from "@/utils/logger";

// --- Types ---
interface Booking {
  _id: string;
  id: string;
  from: string;
  to: string;
  price: number;
  status: string;
  payLater: boolean;
  car?: {
    name: string;
    supplier?: { fullName: string };
  };
  driver?: {
    fullName: string;
    email: string;
  };
}

interface SearchResponse {
  resultData: Booking[];
  pageInfo: [{ totalRecords: number }];
}

export default function BookingsClient() {
  const router = useRouter();
  const { data: session } = useSession();

  const [bookings, setBookings] = useState<readonly Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  const pageSize = 10;

  // 1. Fetch Bookings
  const fetchBookings = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await apiFetchJson<SearchResponse>(`api/admin/bookings/search/${page}/${pageSize}`, {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({
          userId: null,
          suppliers: null,
          statuses: null,
          carId: null,
          filter: { from: null, to: null, keyword: null, pickupLocation: null, dropOffLocation: null },
          page,
          size: pageSize,
          language: "en",
        }),
      });

      setBookings(res.resultData);
      if (res.pageInfo[0].totalRecords) {
        setTotalRecords(res.pageInfo[0].totalRecords);
      }
    } catch (error) {
      logger.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [page, session?.accessToken]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  // Handlers
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(bookings.map(b => b._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      await apiFetchJson(`api/delete-booking/${id}`, {
        method: "DELETE",
        accessToken: session?.accessToken,
      });
      alert("Deleted successfully!");
      void fetchBookings();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete.";
      logger.error("Delete failed:", error);
      alert(message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string): "primary" | "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "Paid":
      case "Completed":
        return "success";
      case "Pending":
      case "Deposit":
        return "warning";
      case "Cancelled":
        return "error";
      case "Reserved":
        return "primary";
      default:
        return "default";
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* رأس الصفحة والأزرار */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Bookings Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {selectedIds.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                alert("Bulk delete not implemented yet");
              }}
            >
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              void fetchBookings();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              router.push("/admin/bookings/create");
            }}
          >
            New Booking
          </Button>
        </Box>
      </Box>

      {/* جدول الحجوزات */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < bookings.length}
                    checked={bookings.length > 0 && selectedIds.length === bookings.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Booking & Car</TableCell>
                <TableCell>Customer / Driver</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">
                      Loading bookings...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">No bookings found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map(booking => (
                  <TableRow key={booking._id} hover selected={selectedIds.includes(booking._id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selectedIds.includes(booking._id)}
                        onChange={() => {
                          handleSelectOne(booking._id);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {booking.car?.name ?? "Deleted Car"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          By: {booking.car?.supplier?.fullName ?? "N/A"}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", fontStyle: "italic", opacity: 0.7 }}>
                          ID: {booking._id.substring(0, 8).toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.driver?.fullName ?? "N/A"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.driver?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          From: {formatDate(booking.from)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          To: {formatDate(booking.to)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: "bold" }}>${booking.price}</Typography>
                      {booking.payLater && (
                        <Typography variant="caption" color="warning.main">
                          Pay Later
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        size="small"
                        color={getStatusColor(booking.status)}
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          router.push(`/admin/bookings/${booking._id}/edit`);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          void handleDelete(booking._id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* الترقيم */}
        {!loading && totalPages > 1 && (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center", borderTop: "1px solid", borderColor: "divider" }}>
            <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
          </Box>
        )}
      </Paper>
    </Container>
  );
}
