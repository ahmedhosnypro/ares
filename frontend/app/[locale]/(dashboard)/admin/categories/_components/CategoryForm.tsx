"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  CircularProgress,
  InputAdornment,
  Typography,
  Divider,
} from "@mui/material";
import { createCategory, updateCategory, Category } from "@/api-clients/categories/categories";
import { useTranslations } from "next-intl";
import { ApiError } from "@/utils/api-client";

interface CategoryFormProps {
  readonly open: boolean;
  readonly category: Category | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export default function CategoryForm({ open, category, onClose, onSuccess }: CategoryFormProps) {
  const t = useTranslations("dashboardAdmin.categories");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        commissionPercentage: category.commissionPercentage,
        isActive: category.isActive,
        offerName: category.activeOffer?.offerName || "",
        offerDiscountPercentage: category.activeOffer?.discountPercentage || 0,
        offerStartDate: category.activeOffer?.startDate
          ? new Date(category.activeOffer.startDate).toISOString().split("T")[0]
          : "",
        offerEndDate: category.activeOffer?.endDate
          ? new Date(category.activeOffer.endDate).toISOString().split("T")[0]
          : "",
        offerIsActive: category.activeOffer?.isActive ?? true,
      });
    } else {
      setFormData({
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
    }
    setError(null);
  }, [category, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t("form.validation.nameRequired"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        offerName: formData.offerName || null,
        offerDiscountPercentage: formData.offerDiscountPercentage || null,
        offerStartDate: formData.offerStartDate ? new Date(formData.offerStartDate).toISOString() : null,
        offerEndDate: formData.offerEndDate ? new Date(formData.offerEndDate).toISOString() : null,
        offerIsActive: formData.offerIsActive,
      };

      if (category) {
        await updateCategory(category.id, payload);
      } else {
        await createCategory(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : t("form.errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{category ? t("form.editTitle") : t("form.addTitle")}</DialogTitle>
      <form
        onSubmit={e => {
          void handleSubmit(e);
        }}
      >
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label={t("form.fields.name")}
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
            />

            <TextField
              label={t("form.fields.description")}
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
            />

            <TextField
              label={t("form.fields.commission")}
              name="commissionPercentage"
              type="number"
              value={formData.commissionPercentage}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { min: 0, max: 100, step: "0.01" },
              }}
            />

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
              label={formData.isActive ? t("table.statusActive") : t("table.statusInactive")}
            />

            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t("form.fields.offerTitle")}
            </Typography>

            <TextField
              label={t("form.fields.offerName")}
              name="offerName"
              value={formData.offerName}
              onChange={handleChange}
              fullWidth
              disabled={loading}
            />

            <TextField
              label={t("form.fields.discount")}
              name="offerDiscountPercentage"
              type="number"
              value={formData.offerDiscountPercentage}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { min: 0, max: 100, step: "0.01" },
              }}
            />

            <TextField
              label={t("form.fields.startDate")}
              name="offerStartDate"
              type="date"
              value={formData.offerStartDate}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              label={t("form.fields.endDate")}
              name="offerEndDate"
              type="date"
              value={formData.offerEndDate}
              onChange={handleChange}
              fullWidth
              disabled={loading}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.offerIsActive}
                  onChange={handleChange}
                  name="offerIsActive"
                  disabled={loading}
                  color="primary"
                />
              }
              label={formData.offerIsActive ? t("form.fields.offerActive") : t("form.fields.offerInactive")}
            />

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : tc("save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
