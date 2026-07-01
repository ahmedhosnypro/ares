"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Box, Typography, Container, Stack, CircularProgress, Button, Chip,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, alpha, useTheme, Card, CardContent, Divider, Paper, Avatar, Alert, Grid
} from "@mui/material";
import { ArrowBackIosNew as BackIcon, Edit as EditIcon, Image as ImageIcon } from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { getCategoryDetails, CategoryDetails } from "@/api-clients/categories/categories";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";
import Image from "next/image";
import { toImageUrl } from "@/utils/image-url";

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
        <Button onClick={() => { router.push("/admin/categories"); }} sx={{ mt: 2 }}>
          {t("backToCategories")}
        </Button>
      </Box>
    );
  }

  const activePromo = category.activePromotion;

  return (
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="lg">
        {/* Page Header */}
        <Stack sx={{ mb: 4, mt: 3 }} spacing={1}>
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <IconButton
              onClick={() => { router.push("/admin/categories"); }}
              sx={{
                bgcolor: "background.paper",
                boxShadow: 1,
                mr: 2,
                color: "text.primary",
                "&:hover": { bgcolor: "background.paper", transform: "translateX(-3px)" },
              }}
            >
              <BackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
              Category Details
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            View category information, promotion and assigned vehicles.
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {/* Category Information */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.palette.shadow?.card || 1, bgcolor: "background.paper", border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`, overflow: "hidden" }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }} />
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                  Category Information
                </Typography>
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => { router.push(`/admin/categories/${category.id}/edit`); }} sx={{ borderRadius: 2, fontWeight: 600 }}>
                  Edit Category
                </Button>
              </Stack>
              <Divider sx={{ mb: 3 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={4} sx={{ alignItems: { xs: "center", sm: "flex-start" } }}>
                {category.imageUrl ? (
                  <Box sx={{ width: 140, height: 140, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                    <Image src={toImageUrl(category.imageUrl) as string} alt={category.name} width={140} height={140} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </Box>
                ) : (
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", width: 140, height: 140, borderRadius: 2, fontWeight: 700, fontSize: "4rem" }}>
                    {category.name.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                
                <Box sx={{ width: "100%" }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>Category Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{category.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>Status</Typography>
                      <Chip label={category.isActive ? "Active" : "Inactive"} size="small" sx={{ bgcolor: alpha(category.isActive ? theme.palette.success.main : theme.palette.text.disabled, 0.15), color: category.isActive ? "success.main" : "text.secondary", fontWeight: 700 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>Commission Percentage</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{category.commissionPercentage}%</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>Description</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{category.description || "—"}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Promotion Section */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.palette.shadow?.card || 1, bgcolor: "background.paper", border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`, overflow: "hidden" }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.main} 100%)` }} />
            <CardContent sx={{ p: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 3 }}>
                Promotion
              </Typography>

              {!activePromo ? (
                <Box sx={{ textAlign: "center", py: 5, bgcolor: "background.default", borderRadius: 2, border: "1px dashed", borderColor: theme.palette.divider }}>
                  <Typography variant="body1" sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}>
                    No Active Promotion
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    This category currently has no active promotion. Edit the category to add one.
                  </Typography>
                </Box>
              ) : (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: theme.palette.divider, bgcolor: "background.default" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 3 }}>
                    <Box>
                      <Stack direction="row" spacing={2} sx={{ mb: 1.5, alignItems: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {activePromo.name}
                        </Typography>
                        <Chip label={activePromo.status} size="small" color={activePromo.status === "Active" ? "success" : "default"} sx={{ fontWeight: 700 }} />
                      </Stack>
                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>Discount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{activePromo.discountPercentage}% OFF</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>Duration</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(activePromo.startDate).toLocaleDateString()} &mdash; {new Date(activePromo.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Vehicles Section */}
          <Card sx={{ borderRadius: 3, boxShadow: theme.palette.shadow?.card || 1, bgcolor: "background.paper", border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`, overflow: "hidden" }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.info.main} 100%)` }} />
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                  Vehicles
                </Typography>
              </Stack>
              
              <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                <TableContainer>
                  <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 600, width: 80 }}>Image</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Vehicle Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>License Plate</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Daily Price</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Availability</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category.vehicles && category.vehicles.length > 0 ? (
                        category.vehicles.map(v => (
                          <TableRow key={v.id} hover>
                            <TableCell>
                              {v.imageUrl ? (
                                <Box sx={{ width: 60, height: 40, borderRadius: 1, overflow: "hidden" }}>
                                  <Image src={toImageUrl(v.imageUrl) as string} alt={v.make} width={60} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                </Box>
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 60, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main" }}>
                                  <ImageIcon fontSize="small" />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{v.make} {v.model}</TableCell>
                            <TableCell>{v.licensePlate || "—"}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{v.pricePerDay ? `$${v.pricePerDay}` : "—"}</TableCell>
                            <TableCell>
                              <Chip label={v.status || "Unknown"} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem", bgcolor: alpha(theme.palette.text.disabled, 0.1) }} />
                            </TableCell>
                            <TableCell>
                              <Chip label={v.availabilityStatus || "Unknown"} size="small" color={v.availabilityStatus === "Available" ? "success" : "default"} sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                            </TableCell>
                            <TableCell align="right">
                              <Button size="small" variant="outlined" onClick={() => { router.push(`/admin/vehicles/${v.id}`); }} sx={{ fontWeight: 600, borderRadius: 2 }}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: "center", py: 2 }}>
                              <Typography color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>No Vehicles Found</Typography>
                              <Typography variant="body2" color="text.secondary">
                                This category doesn't have any vehicles assigned yet.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {category.vehicles && category.vehicles.length > 0 && (
                  <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.default" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Showing {category.vehicles.length} of {category.vehicles.length} Vehicles
                    </Typography>
                    <Button variant="text" size="small" onClick={() => { router.push(`/admin/vehicles?categoryId=${category.id}`); }} sx={{ fontWeight: 600 }}>
                      View All Vehicles
                    </Button>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
