"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Box,
  Typography,
  Container,
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
  Card,
  CardContent,
  Divider,
  Paper,
  Avatar,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  ArrowBackIosNew as BackIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import {
  getCategoryDetails,
  updateCategory,
  uploadCategoryImage,
  CategoryDetails,
} from "@/api-clients/categories/categories";
import { createDiscountCode, updateDiscountCode, deleteDiscountCode } from "@/api-clients/promotions/promotions";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";
import Image from "next/image";
import { toImageUrl } from "@/utils/image-url";

export default function EditCategoryPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();
  const token = session?.accessToken as string;
  const t = useTranslations("dashboardAdmin.categoryDetails");

  const [category, setCategory] = useState<CategoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    commissionPercentage: 0,
    isActive: true,
  });

  const [activePromotion, setActivePromotion] = useState<CategoryDetails["activePromotion"] | null>(null);

  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ id: "", name: "", discountPercentage: 0, startDate: "", endDate: "" });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const fetchCategoryDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategoryDetails(resolvedParams.id);
      setCategory(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        commissionPercentage: data.commissionPercentage || 0,
        isActive: data.isActive,
      });
      setActivePromotion(data.activePromotion || null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Category Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateCategory(resolvedParams.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        commissionPercentage: formData.commissionPercentage,
        isActive: formData.isActive,
      });
      router.push(`/admin/categories/${resolvedParams.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update category.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setLoading(true);
      await uploadCategoryImage(resolvedParams.id, file);
      await fetchCategoryDetails();
    } catch (err: any) {
      setError(err?.message || "Failed to upload image.");
      setLoading(false);
    }
  };

  const handlePromoSubmit = async () => {
    if (!promoForm.name.trim() || !promoForm.startDate || !promoForm.endDate) {
      setPromoError("Please fill in all required fields.");
      return;
    }

    setPromoError(null);
    setPromoSaving(true);
    try {
      if (promoForm.id) {
        await updateDiscountCode(
          promoForm.id,
          {
            description: promoForm.name,
            validTo: new Date(promoForm.endDate).toISOString(),
          },
          token
        );
      } else {
        await createDiscountCode(
          {
            code: promoForm.name,
            description: promoForm.name,
            discountType: "percentage",
            discountValue: promoForm.discountPercentage,
            validFrom: new Date(promoForm.startDate).toISOString(),
            validTo: new Date(promoForm.endDate).toISOString(),
            vehicleCategoryIds: [resolvedParams.id],
          },
          token
        );
      }
      setPromoDialogOpen(false);
      // Only refresh the promotion section instead of the whole page if possible,
      // but fetchCategoryDetails is easiest and reliable.
      const data = await getCategoryDetails(resolvedParams.id);
      setActivePromotion(data.activePromotion || null);
    } catch (err: any) {
      setPromoError(err?.message || "Failed to save promotion");
    } finally {
      setPromoSaving(false);
    }
  };

  const handleDeletePromotion = async (promoId: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await deleteDiscountCode(promoId, true, token);
      const data = await getCategoryDetails(resolvedParams.id);
      setActivePromotion(data.activePromotion || null);
    } catch (err) {
      console.error("Failed to delete promotion", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !category) {
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
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="lg">
        {/* Page Header */}
        <Stack sx={{ mb: 4, mt: 3 }} spacing={1}>
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <IconButton
              onClick={() => {
                router.push(`/admin/categories/${resolvedParams.id}`);
              }}
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
              Edit Category
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            Update category information and manage promotions.
          </Typography>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {/* Category Information */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: theme.palette.shadow?.card || 1,
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: 6,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              />
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Category Information
                  </Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    Save Changes
                  </Button>
                </Stack>
                <Divider sx={{ mb: 3 }} />

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={4}
                  sx={{ alignItems: { xs: "center", sm: "flex-start" } }}
                >
                  {/* Image Upload Component */}
                  <Stack spacing={2} sx={{ flexShrink: 0, alignItems: "center" }}>
                    {category?.imageUrl ? (
                      <Box sx={{ width: 140, height: 140, borderRadius: 2, overflow: "hidden", position: "relative" }}>
                        <Image
                          src={toImageUrl(category.imageUrl) as string}
                          alt={category.name}
                          width={140}
                          height={140}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      </Box>
                    ) : (
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          width: 140,
                          height: 140,
                          borderRadius: 2,
                          fontWeight: 700,
                          fontSize: "4rem",
                        }}
                      >
                        {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                      </Avatar>
                    )}
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<UploadIcon />}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleImageUpload}
                      />
                    </Button>
                  </Stack>

                  <Box sx={{ width: "100%" }}>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Category Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          fullWidth
                          required
                          disabled={saving}
                          slotProps={{ input: { sx: { borderRadius: 2 } } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isActive}
                              onChange={handleChange}
                              name="isActive"
                              disabled={saving}
                              color="primary"
                            />
                          }
                          label={
                            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                              {formData.isActive ? "Category Active" : "Category Inactive"}
                            </Typography>
                          }
                          sx={{ ml: 1 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Commission Percentage"
                          name="commissionPercentage"
                          type="number"
                          value={formData.commissionPercentage}
                          onChange={handleChange}
                          fullWidth
                          disabled={saving}
                          slotProps={{
                            input: {
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              sx: { borderRadius: 2 },
                            },
                            htmlInput: { min: 0, max: 100, step: "0.01" },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          fullWidth
                          multiline
                          rows={3}
                          disabled={saving}
                          slotProps={{ input: { sx: { borderRadius: 2 } } }}
                        />
                      </Grid>
                    </Grid>
                    {error && (
                      <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </form>

        <Stack spacing={4} sx={{ mt: 4 }}>
          {/* Promotion Section */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.palette.shadow?.card || 1,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 6,
                background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.main} 100%)`,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 3 }}>
                Promotion
              </Typography>

              {!activePromotion ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 5,
                    bgcolor: "background.default",
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: theme.palette.divider,
                  }}
                >
                  <Typography variant="body1" sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}>
                    No Active Promotion
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setPromoForm({ id: "", name: "", discountPercentage: 0, startDate: "", endDate: "" });
                      setPromoDialogOpen(true);
                    }}
                    sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
                  >
                    + Add Promotion
                  </Button>
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: theme.palette.divider,
                    bgcolor: "background.default",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 3 }}
                  >
                    <Box>
                      <Stack direction="row" spacing={2} sx={{ mb: 1.5, alignItems: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {activePromotion.name}
                        </Typography>
                        <Chip
                          label={activePromotion.status}
                          size="small"
                          color={activePromotion.status === "Active" ? "success" : "default"}
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, display: "block" }}
                          >
                            Discount
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {activePromotion.discountPercentage}% OFF
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600, display: "block" }}
                          >
                            Duration
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(activePromotion.startDate).toLocaleDateString()} &mdash;{" "}
                            {new Date(activePromotion.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setPromoForm({
                            id: activePromotion.id,
                            name: activePromotion.name,
                            discountPercentage: activePromotion.discountPercentage,
                            startDate: activePromotion.startDate.split("T")[0],
                            endDate: activePromotion.endDate.split("T")[0],
                          });
                          setPromoDialogOpen(true);
                        }}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Edit Promotion
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeletePromotion(activePromotion.id)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Delete Promotion
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Vehicles Section (Read Only) */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.palette.shadow?.card || 1,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.border?.main || theme.palette.divider}`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 6,
                background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.info.main} 100%)`,
              }}
            />
            <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                  Vehicles
                </Typography>
              </Stack>

              <Paper
                elevation={0}
                sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
              >
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
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category?.vehicles && category.vehicles.length > 0 ? (
                        category.vehicles.map(v => (
                          <TableRow key={v.id} hover>
                            <TableCell>
                              {v.imageUrl ? (
                                <Box sx={{ width: 60, height: 40, borderRadius: 1, overflow: "hidden" }}>
                                  <Image
                                    src={toImageUrl(v.imageUrl) as string}
                                    alt={v.make}
                                    width={60}
                                    height={40}
                                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                  />
                                </Box>
                              ) : (
                                <Avatar
                                  variant="rounded"
                                  sx={{
                                    width: 60,
                                    height: 40,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: "primary.main",
                                  }}
                                >
                                  <ImageIcon fontSize="small" />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {v.make} {v.model}
                            </TableCell>
                            <TableCell>{v.licensePlate || "—"}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{v.pricePerDay ? `$${v.pricePerDay}` : "—"}</TableCell>
                            <TableCell>
                              <Chip
                                label={v.status || "Unknown"}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  bgcolor: alpha(theme.palette.text.disabled, 0.1),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={v.availabilityStatus || "Unknown"}
                                size="small"
                                color={v.availabilityStatus === "Available" ? "success" : "default"}
                                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  router.push(`/admin/vehicles/${v.id}`);
                                }}
                                sx={{ fontWeight: 600, borderRadius: 2 }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: "center", py: 2 }}>
                              <Typography color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                                No Vehicles Found
                              </Typography>
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
                {category?.vehicles && category.vehicles.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Showing {category.vehicles.length} of {category.vehicles.length} Vehicles
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        router.push(`/admin/vehicles?categoryId=${category.id}`);
                      }}
                      sx={{ fontWeight: 600 }}
                    >
                      View All Vehicles
                    </Button>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Stack>

        {/* Promotion Dialog */}
        <Dialog
          open={promoDialogOpen}
          onClose={() => !promoSaving && setPromoDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>{promoForm.id ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
          <DialogContent dividers>
            {promoError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {promoError}
              </Alert>
            )}
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Promotion Name"
                  fullWidth
                  required
                  value={promoForm.name}
                  onChange={e => {
                    setPromoForm({ ...promoForm, name: e.target.value });
                  }}
                  disabled={promoSaving || !!promoForm.id}
                  placeholder="e.g., Summer Sale"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Discount Percentage"
                  type="number"
                  fullWidth
                  required
                  value={promoForm.discountPercentage}
                  onChange={e => {
                    setPromoForm({ ...promoForm, discountPercentage: Number(e.target.value) });
                  }}
                  disabled={promoSaving || !!promoForm.id}
                  slotProps={{
                    input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                    htmlInput: { min: 0, max: 100 },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  required
                  value={promoForm.startDate}
                  onChange={e => {
                    setPromoForm({ ...promoForm, startDate: e.target.value });
                  }}
                  disabled={promoSaving || !!promoForm.id}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  required
                  value={promoForm.endDate}
                  onChange={e => {
                    setPromoForm({ ...promoForm, endDate: e.target.value });
                  }}
                  disabled={promoSaving}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => {
                setPromoDialogOpen(false);
              }}
              disabled={promoSaving}
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handlePromoSubmit}
              disabled={promoSaving || !promoForm.name.trim() || !promoForm.startDate || !promoForm.endDate}
              startIcon={promoSaving && <CircularProgress size={20} color="inherit" />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              {promoForm.id ? "Save Changes" : "Create Promotion"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
