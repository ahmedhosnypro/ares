"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  IconButton,
  Stack,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  CircularProgress,
  InputAdornment,
  useTheme,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
import { Link, useRouter } from "@/shared/i18n/routing";
import { useParams } from "next/navigation";
import { getCategoryDetails, updateCategory } from "@/api-clients/categories/categories";
import { logger } from "@/utils/logger";

export default function EditCategoryPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    commissionPercentage: 0,
    isActive: true,
    offerName: "",
    offerDiscountPercentage: 0,
    offerStartDate: "",
    offerEndDate: "",
    offerIsActive: true,
  });

  useEffect(() => {
    if (!id) return;

    const fetchCategoryDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategoryDetails(id);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          commissionPercentage: data.commissionPercentage || 0,
          isActive: data.isActive,
          offerName: data.activeOffer?.offerName || "",
          offerDiscountPercentage: data.activeOffer?.discountPercentage || 0,
          offerStartDate: data.activeOffer?.startDate
            ? new Date(data.activeOffer.startDate).toISOString().split("T")[0]
            : "",
          offerEndDate: data.activeOffer?.endDate ? new Date(data.activeOffer.endDate).toISOString().split("T")[0] : "",
          offerIsActive: data.activeOffer?.isActive ?? true,
        });
      } catch (err: unknown) {
        logger.error("Failed to load category details", err);
        setError("Failed to load category details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchCategoryDetails();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!formData.name.trim()) {
      setError("Category Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        commissionPercentage: formData.commissionPercentage,
        isActive: formData.isActive,
        offerName: formData.offerName.trim() || null,
        offerDiscountPercentage: formData.offerName.trim() ? formData.offerDiscountPercentage : null,
        offerStartDate:
          formData.offerName.trim() && formData.offerStartDate ? new Date(formData.offerStartDate).toISOString() : null,
        offerEndDate:
          formData.offerName.trim() && formData.offerEndDate ? new Date(formData.offerEndDate).toISOString() : null,
        offerIsActive: formData.offerName.trim() ? formData.offerIsActive : null,
      };

      await updateCategory(id, payload);
      router.push("/admin/categories");
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || "Failed to update category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, minHeight: "100vh" }}>
      <Container maxWidth="md">
        {/* Header section with back button */}
        <Stack direction="row" sx={{ alignItems: "center", mb: 4, mt: 3 }}>
          <Link href="/admin/categories" style={{ textDecoration: "none" }}>
            <IconButton
              sx={{
                bgcolor: "background.paper",
                boxShadow: 1,
                mr: 2,
                color: "text.primary",
                "&:hover": {
                  bgcolor: "background.paper",
                  transform: "translateX(-3px)",
                },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Link>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
            Edit Category
          </Typography>
        </Stack>

        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: theme.palette.shadow.card,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.border.main}`,
              overflow: "hidden",
            }}
          >
            {/* Elegant Header Accent */}
            <Box
              sx={{
                height: 6,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            />
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                    Category Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Category Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={saving}
                    placeholder="e.g., Luxury, SUV, Economy"
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2 },
                      },
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
                    placeholder="Provide a brief description of the vehicles in this category..."
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
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
                  />
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                    Promotional Offer (Optional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Apply an active discount to all vehicles in this category.
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Offer Name"
                    name="offerName"
                    value={formData.offerName}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving}
                    placeholder="e.g., Summer Special, Weekend Discount"
                    slotProps={{
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Discount Percentage"
                    name="offerDiscountPercentage"
                    type="number"
                    value={formData.offerDiscountPercentage}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving || !formData.offerName.trim()}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        sx: { borderRadius: 2 },
                      },
                      htmlInput: { min: 0, max: 100, step: "0.01" },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.offerIsActive}
                        onChange={handleChange}
                        name="offerIsActive"
                        disabled={saving || !formData.offerName.trim()}
                        color="primary"
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                        {formData.offerIsActive ? "Offer Active" : "Offer Inactive"}
                      </Typography>
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Start Date"
                    name="offerStartDate"
                    type="date"
                    value={formData.offerStartDate}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving || !formData.offerName.trim()}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="End Date"
                    name="offerEndDate"
                    type="date"
                    value={formData.offerEndDate}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving || !formData.offerName.trim()}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        sx: { borderRadius: 2 },
                      },
                    }}
                  />
                </Grid>

                {error && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                    <Link href="/admin/categories" passHref style={{ textDecoration: "none" }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        disabled={saving}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={saving || !formData.name.trim()}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        fontWeight: 700,
                        boxShadow: theme.palette.shadow.button,
                        "&:hover": {
                          boxShadow: theme.palette.shadow.buttonHover,
                        },
                      }}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </form>
      </Container>
    </Box>
  );
}
