"use client";

import React, { useEffect, useState } from "react";
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
  useTheme
} from "@mui/material";
import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiFetchJson } from "@/utils/api-client";

interface VehicleListDto {
  vehicleId: string;
  make: string;
  model: string;
  category: string;
  dailyRate: number;
  currency: string;
  available: boolean;
}

interface PagedResult {
  data: VehicleListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminCarsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [vehicles, setVehicles] = useState<VehicleListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchVehicles = async (currentPage: number) => {
    try {
      setLoading(true);
      if (session?.accessToken) {
        const response = await apiFetchJson<PagedResult>(`api/vehicles/search/${currentPage}/${pageSize}`, {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({}) // Empty filter for now
        });
        setVehicles(response.data || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchVehicles(page);
    }
  }, [page, session]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    
    try {
      if (session?.accessToken) {
        // First check if it has active bookings
        const hasBookings = await apiFetchJson<bool>(`api/admin/cars/${id}/check-bookings`, {
          accessToken: session.accessToken
        });

        if (hasBookings) {
          alert("Cannot delete vehicle with active bookings.");
          return;
        }

        await apiFetchJson(`api/admin/cars/${id}/delete`, {
          method: "DELETE",
          accessToken: session.accessToken
        });
        
        alert("Vehicle deleted successfully");
        fetchVehicles(page);
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert(error.message || "Failed to delete vehicle");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">
          Fleet Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/cars/create')}
          sx={{ borderRadius: 2, fontWeight: 'bold' }}
        >
          Add New Vehicle
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Daily Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : vehicles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No vehicles found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles?.map((vehicle) => (
                  <TableRow key={vehicle.vehicleId} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="600">{vehicle.make} {vehicle.model}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {vehicle.vehicleId.substring(0, 8)}...</Typography>
                    </TableCell>
                    <TableCell>{vehicle.category || "N/A"}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">{vehicle.dailyRate} {vehicle.currency}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vehicle.available ? "Available" : "Unavailable"} 
                        color={vehicle.available ? "success" : "default"} 
                        size="small" 
                        variant={vehicle.available ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => router.push(`/admin/cars/${vehicle.vehicleId}`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(vehicle.vehicleId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && vehicles.length > 0 && (
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