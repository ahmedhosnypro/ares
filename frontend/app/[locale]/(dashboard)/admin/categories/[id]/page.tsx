"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBackRounded as BackIcon,
  DirectionsCar as CarIcon,
  EventAvailable as BookingIcon,
  MonetizationOn as RevenueIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { getCategoryDetails, CategoryDetails } from "@/api-clients/categories/categories";
import Alert from "@mui/material/Alert";
import PromotionManager from "../_components/PromotionManager";

export default function CategoryDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();

  const [category, setCategory] = useState<CategoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoryDetails(resolvedParams.id);
      setCategory(data);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || "Failed to load category details.");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    if (session?.accessToken) {
      void fetchCategoryDetails();
    }
  }, [session, fetchCategoryDetails]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !category) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Alert severity="error">{error || "Category not found."}</Alert>
        <Button
          onClick={() => {
            router.push("/admin/categories");
          }}
          sx={{ mt: 2 }}
        >
          Back to Categories
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 4 }}>
        <IconButton
          onClick={() => {
            router.push("/admin/categories");
          }}
        >
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {category.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
            <Chip
              label={category.isActive ? "Active" : "Inactive"}
              size="small"
              sx={{
                bgcolor: alpha(category.isActive ? theme.palette.success.main : theme.palette.text.disabled, 0.15),
                color: category.isActive ? "success.main" : "text.secondary",
                fontWeight: 700,
              }}
            />
            {category.description && (
              <Typography variant="body2" color="text.secondary">
                {category.description}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}
            >
              <CarIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Vehicles
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {category.vehicleCount || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: "success.main" }}
            >
              <BookingIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Bookings
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {category.bookingCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: "warning.main" }}
            >
              <RevenueIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                ${category.revenue.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Vehicles in Category
          </Typography>
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>Make & Model</TableCell>
                    <TableCell>License Plate</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {category.vehicles.length > 0 ? (
                    category.vehicles.map(v => (
                      <TableRow key={v.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {v.make} {v.model}
                        </TableCell>
                        <TableCell>{v.licensePlate || "—"}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => {
                              router.push(`/admin/vehicles/${v.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No vehicles assigned to this category.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Promotions
          </Typography>
          <PromotionManager categoryId={category.id} />
        </Grid>
      </Grid>
    </Box>
  );
}
