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
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";

export default function CategoryDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.categoryDetails");

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
      if (err instanceof ApiError && err.status === 404) {
        setError(t("errors.notFound"));
      } else {
        setError(err instanceof ApiError ? err.message : t("errors.loadError"));
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, t]);

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
        <Alert severity="error">{error || t("errors.notFound")}</Alert>
        <Button
          onClick={() => {
            router.push("/admin/categories");
          }}
          sx={{ mt: 2 }}
        >
          {t("backToCategories")}
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
              label={category.isActive ? t("statusActive") : t("statusInactive")}
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
                {t("stats.totalVehicles")}
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
                {t("stats.totalBookings")}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {(category.bookingCount as number | null) ?? 0}
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
                {t("stats.revenue")}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                ${((category.revenue as number | null) ?? 0).toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {t("vehiclesTable.title")}
          </Typography>
          <Paper
            elevation={0}
            sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell>{t("vehiclesTable.headers.makeModel")}</TableCell>
                    <TableCell>{t("vehiclesTable.headers.licensePlate")}</TableCell>
                    <TableCell align="right">{t("vehiclesTable.headers.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {((category.vehicles as typeof category.vehicles | null) ?? []).length > 0 ? (
                    ((category.vehicles as typeof category.vehicles | null) ?? []).map(v => (
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
                            {t("vehiclesTable.viewButton")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">{t("vehiclesTable.empty")}</Typography>
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
            {t("promotions.title")}
          </Typography>
          <PromotionManager categoryId={category.id} />
        </Grid>
      </Grid>
    </Box>
  );
}
