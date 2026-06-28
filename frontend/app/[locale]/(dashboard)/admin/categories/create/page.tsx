"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
import { Link, useRouter } from "@/shared/i18n/routing";
import { createCategory } from "@/api-clients/categories/categories";

export default function CreateCategoryPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
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

      await createCategory(payload);
      router.push("/admin/categories");
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || "Failed to create category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            Create New Category
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
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
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
                        disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading || !formData.offerName.trim()}
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
                        disabled={loading || !formData.offerName.trim()}
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
                    disabled={loading || !formData.offerName.trim()}
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
                    disabled={loading || !formData.offerName.trim()}
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
                    <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>
                      {error}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                    <Link href="/admin/categories" passHref style={{ textDecoration: "none" }}>
                      <Button
                        variant="outlined"
                        color="inherit"
                        disabled={loading}
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
                      disabled={loading || !formData.name.trim()}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
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
                      {loading ? "Creating..." : "Create Category"}
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
