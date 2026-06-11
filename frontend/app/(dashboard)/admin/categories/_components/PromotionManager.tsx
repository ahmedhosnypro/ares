"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  useTheme,
  alpha,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  LocalOffer as PromoIcon,
} from "@mui/icons-material";
import {
  getPromotionsByCategory,
  createPromotion,
  updatePromotion,
  deletePromotion,
  Promotion,
} from "@/api-clients/categories/categories";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function PromotionManager({ categoryId }: { readonly categoryId: string }) {
  const theme = useTheme();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    discountPercentage: 0,
    startDate: "",
    endDate: "",
    status: "Active",
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPromotionsByCategory(categoryId);
      setPromotions(data);
    } catch (err) {
      setError("Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      name: "",
      discountPercentage: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: "Active",
    });
    setFormOpen(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      name: promo.name,
      discountPercentage: promo.discountPercentage,
      startDate: new Date(promo.startDate).toISOString().slice(0, 16),
      endDate: new Date(promo.endDate).toISOString().slice(0, 16),
      status: promo.status,
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await deletePromotion(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
      setSnackbar({ open: true, message: "Promotion deleted.", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || "Failed to delete promotion.", severity: "error" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.discountPercentage <= 0) {
      setSnackbar({ open: true, message: "Please fill out required fields correctly.", severity: "error" });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setSnackbar({ open: true, message: "End date must be after start date.", severity: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = { ...formData, categoryId };
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, payload);
      } else {
        await createPromotion(payload);
      }
      setFormOpen(false);
      fetchPromotions();
      setSnackbar({ open: true, message: "Promotion saved successfully.", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || "Failed to save promotion.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 4, display: "flex", justifyContent: "center", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <CircularProgress size={30} />
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
            <PromoIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Active & Scheduled</Typography>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} onClick={handleCreate} sx={{ fontWeight: 700 }}>
            Add
          </Button>
        </Box>
        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : promotions.length > 0 ? (
            <Stack spacing={2}>
              {promotions.map(promo => (
                <Paper key={promo.id} elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), border: "1px solid", borderColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{promo.name}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>{promo.discountPercentage}% OFF</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
                      <Chip
                        label={promo.status}
                        size="small"
                        sx={{
                          height: 20, fontSize: 10, fontWeight: 700,
                          bgcolor: alpha(promo.isActive ? theme.palette.success.main : theme.palette.text.disabled, 0.15),
                          color: promo.isActive ? "success.main" : "text.secondary",
                        }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleEdit(promo)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(promo.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">No promotions found.</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={formOpen} onClose={submitting ? undefined : () => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPromotion ? "Edit Promotion" : "Add Promotion"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField
                label="Promotion Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                disabled={submitting}
              />
              <TextField
                label="Discount"
                name="discountPercentage"
                type="number"
                value={formData.discountPercentage}
                onChange={handleChange}
                fullWidth
                required
                disabled={submitting}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  },
                  htmlInput: { min: 1, max: 100, step: "0.1" }
                }}
              />
              <TextField
                label="Start Date"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                fullWidth
                required
                disabled={submitting}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Date"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                fullWidth
                required
                disabled={submitting}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                disabled={submitting}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setFormOpen(false)} disabled={submitting} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 700 }}>
              {submitting ? <CircularProgress size={24} color="inherit" /> : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
