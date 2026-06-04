"use client";

import React, { useEffect, useState } from "react";
import { 
  Box, Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, IconButton, 
  CircularProgress, Pagination, useTheme, Checkbox
} from "@mui/material";
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon, DeleteSweep as DeleteSweepIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client"; // تأكد من صحة مسار الـ Helper

// --- Types ---
interface Booking {
  _id: string;
  car: { _id: string; name: string; supplier: { fullName: string } } | null;
  driver: { _id: string; fullName: string; email: string } | null;
  pickupLocation: { _id: string; name: string } | null;
  dropOffLocation: { _id: string; name: string } | null;
  from: string;
  to: string;
  price: number;
  status: string;
  payLater: boolean;
}

interface BookingResponse {
  resultData: Booking[];
  pageInfo: [{ totalRecords: number }];
}

export default function BookingsClient() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const pageSize = 10;

  // جلب البيانات
  const fetchBookings = async (currentPage: number) => {
    try {
      setLoading(true);
      if (session?.accessToken) {
        // بناء الـ Body الافتراضي حسب الدكيومنتيشن
        const requestBody = {
          suppliers: [],
          statuses: [],
          user: null,
          car: null,
          filter: {
            from: null,
            to: null,
            keyword: null,
            pickupLocation: null,
            dropOffLocation: null
          }
        };

        const response = await apiFetchJson<BookingResponse>(`api/bookings/${currentPage}/${pageSize}/en`, {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify(requestBody)
        });

        setBookings(response.resultData || []);
        
        // حساب عدد الصفحات الكلي
        const totalRecords = response.pageInfo?.[0]?.totalRecords || 0;
        setTotalPages(Math.ceil(totalRecords / pageSize) || 1);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchBookings(page);
    }
  }, [page, session]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // التحكم في التحديد (Checkboxes) للحذف المتعدد
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(bookings.map((b) => b._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // وظيفة الحذف (تدعم الحذف الفردي والمتعدد لأن الـ API يتطلب مصفوفة Ids)
  const handleDelete = async (idsToDelete: string[]) => {
    if (!confirm(`Are you sure you want to delete ${idsToDelete.length} booking(s)?`)) return;
    
    try {
      if (session?.accessToken) {
        await apiFetchJson(`api/delete-bookings`, {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({ ids: idsToDelete })
        });
        
        alert("Booking(s) deleted successfully");
        setSelectedIds([]); // تصفير التحديد
        fetchBookings(page); // تحديث الجدول
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete booking(s)");
    }
  };

  // دالة لتلوين حالة الحجز (Status)
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'reserved') return "success";
    if (s === 'pending' || s === 'deposit') return "warning";
    if (s === 'cancelled') return "error";
    return "default";
  };

  // تنسيق التاريخ ليكون مقروء
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* رأس الصفحة والأزرار */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">
          Bookings Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedIds.length > 0 && (
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => handleDelete(selectedIds)}
              sx={{ borderRadius: 2, fontWeight: 'bold' }}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/admin/bookings/create')}
            sx={{ borderRadius: 2, fontWeight: 'bold' }}
          >
            Add New Booking
          </Button>
        </Box>
      </Box>

      {/* جدول الحجوزات */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < bookings.length}
                    checked={bookings.length > 0 && selectedIds.length === bookings.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Car / Supplier</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Dates</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No bookings found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const isSelected = selectedIds.includes(booking._id);
                  return (
                    <TableRow key={booking._id} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          color="primary" 
                          checked={isSelected} 
                          onChange={() => handleSelectOne(booking._id)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="600">{booking.car?.name || "Deleted Car"}</Typography>
                        <Typography variant="caption" color="text.secondary">By: {booking.car?.supplier?.fullName || "N/A"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.driver?.fullName || "N/A"}</Typography>
                        <Typography variant="caption" color="text.secondary">{booking.driver?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(booking.from)}</Typography>
                        <Typography variant="caption" color="text.secondary">To: {formatDate(booking.to)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="bold">${booking.price}</Typography>
                        {booking.payLater && <Typography variant="caption" color="warning.main">Pay Later</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getStatusColor(booking.status) as any} 
                          size="small" 
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {/* زر التعديل يوجهنا لصفحة التعديل التي سنبنيها لاحقاً */}
                        <IconButton color="primary" onClick={() => router.push(`/admin/bookings/${booking._id}/edit`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {/* زر الحذف الفردي */}
                        <IconButton color="error" onClick={() => handleDelete([booking._id])}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* شريط التقسيم (Pagination) */}
        {!loading && bookings.length > 0 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}