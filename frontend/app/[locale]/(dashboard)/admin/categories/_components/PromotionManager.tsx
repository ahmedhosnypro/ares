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
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";

export default function PromotionManager({ categoryId }: { readonly categoryId: string }) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.categoryDetails");
  const tc = useTranslations("common");
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      setPromotions(data ?? []);
    } catch {
      setError(t("promotions.alerts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [categoryId, t]);

  useEffect(() => {
    void fetchPromotions();
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
    if (!window.confirm(t("promotions.deleteConfirm"))) return;
    try {
      await deletePromotion(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
      setSnackbar({ open: true, message: t("promotions.alerts.deleteSuccess"), severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : t("promotions.alerts.deleteError"),
        severity: "error",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.discountPercentage <= 0) {
      setSnackbar({ open: true, message: t("promotions.alerts.requiredFields"), severity: "error" });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setSnackbar({ open: true, message: t("promotions.alerts.dateOrderError"), severity: "error" });
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
      void fetchPromotions();
      setSnackbar({ open: true, message: t("promotions.alerts.saveSuccess"), severity: "success" });
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: err instanceof ApiError ? err.message : t("promotions.alerts.saveError"),
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Active":
        return t("promotions.form.statusOptions.active");
      case "Inactive":
        return t("promotions.form.statusOptions.inactive");
      case "Expired":
        return t("promotions.form.statusOptions.expired");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CircularProgress size={30} />
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
            <PromoIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("promotions.activeScheduled")}
            </Typography>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} onClick={handleCreate} sx={{ fontWeight: 700 }}>
            {t("promotions.addBtn")}
          </Button>
        </Box>
        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : ((promotions as Promotion[] | null) ?? []).length > 0 ? (
            <Stack spacing={2}>
              {((promotions as Promotion[] | null) ?? []).map(promo => (
                <Paper
                  key={promo.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: "primary.main" }}>{promo.name}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {promo.discountPercentage}
                        {t("promotions.percentOff")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {promo.startDate ? new Date(promo.startDate).toLocaleDateString() : ""} -{" "}
                        {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : ""}
                      </Typography>
                    </Box>
                    <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
                      <Chip
                        label={getStatusLabel(promo.status)}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: alpha(
                            promo.isActive ? theme.palette.success.main : theme.palette.text.disabled,
                            0.15
                          ),
                          color: promo.isActive ? "success.main" : "text.secondary",
                        }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleEdit(promo);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            void handleDelete(promo.id);
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t("promotions.empty")}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog
        open={formOpen}
        onClose={
          submitting
            ? undefined
            : () => {
                setFormOpen(false);
              }
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPromotion ? t("promotions.form.editTitle") : t("promotions.form.addTitle")}
        </DialogTitle>
        <form
          onSubmit={e => {
            void handleSubmit(e);
          }}
        >
          <DialogContent dividers>
            <Stack spacing={3}>
              <TextField
                label={t("promotions.form.name")}
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                disabled={submitting}
              />
              <TextField
                label={t("promotions.form.discount")}
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
                  htmlInput: { min: 1, max: 100, step: "0.1" },
                }}
              />
              <TextField
                label={t("promotions.form.startDate")}
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
                label={t("promotions.form.endDate")}
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
                label={t("promotions.form.status")}
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                disabled={submitting}
              >
                <MenuItem value="Active">{t("promotions.form.statusOptions.active")}</MenuItem>
                <MenuItem value="Inactive">{t("promotions.form.statusOptions.inactive")}</MenuItem>
                <MenuItem value="Expired">{t("promotions.form.statusOptions.expired")}</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setFormOpen(false);
              }}
              disabled={submitting}
              color="inherit"
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 700 }}>
              {submitting ? <CircularProgress size={24} color="inherit" /> : tc("save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
