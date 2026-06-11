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
} from "@mui/material";
import { createCategory, updateCategory, Category } from "@/api-clients/categories/categories";

interface CategoryFormProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryForm({ open, category, onClose, onSuccess }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    commissionPercentage: 0,
    isActive: true,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        commissionPercentage: category.commissionPercentage,
        isActive: category.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        commissionPercentage: 0,
        isActive: true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (category) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {category ? "Edit Category" : "Add Category"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
            />
            
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
            />
            
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
                },
                htmlInput: { min: 0, max: 100, step: "0.01" }
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
              label={formData.isActive ? "Active" : "Inactive"}
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
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
