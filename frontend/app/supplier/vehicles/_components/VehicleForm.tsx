"use client";

/**
 * Shared vehicle form for the supplier portal.
 *
 * Used by both `/supplier/vehicles/create` and `/supplier/vehicles/[id]/edit`
 * so the field layout, validation rules, and dropdown options stay identical
 * between the two flows.
 *
 * Field set, dropdown values, and validation approach mirror the existing
 * admin create page (`app/admin/cars/create/page.tsx`) but trim the
 * admin-only "category" / availability fields — those are managed elsewhere
 * (admin approval and the row-level toggle, respectively).
 */

import { ChangeEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { z } from "zod";

// ── Validation ────────────────────────────────────────────────────────────────
// Matches the FluentValidation rules on the backend
// (`CreateSupplierVehicleRequestValidator`).
export const vehicleFormSchema = z.object({
  make: z.string().trim().min(2, "Make is required"),
  model: z.string().trim().min(2, "Model is required"),
  year: z
    .number()
    .int("Year must be a whole number")
    .min(1901, "Year must be later than 1900")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().trim().min(2, "Color is required"),
  licensePlate: z.string().trim().min(2, "License plate is required").max(50),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.string().min(1, "Fuel type is required"),
  seats: z.number().int().min(1, "Seats must be at least 1").max(50, "Seats must not exceed 50"),
  pricePerDay: z.number().min(0.01, "Price per day must be greater than 0"),
  locationCity: z.string().trim().min(2, "City is required"),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .trim()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

// ── Dropdown options ──────────────────────────────────────────────────────────
const TRANSMISSION_OPTIONS = ["Automatic", "Manual"] as const;
const FUEL_OPTIONS = ["Gasoline", "Diesel", "Electric", "Hybrid", "PluginHybrid"] as const;

export const DEFAULT_VEHICLE_FORM: VehicleFormValues = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  licensePlate: "",
  transmission: "Automatic",
  fuelType: "Gasoline",
  seats: 4,
  pricePerDay: 0,
  locationCity: "",
  description: "",
  imageUrl: "",
};

interface VehicleFormProps {
  readonly initialValues?: VehicleFormValues;
  readonly submitLabel: string;
  readonly submitting: boolean;
  readonly apiError?: string | null;
  readonly readOnly?: boolean;
  readonly onSubmit: (values: VehicleFormValues) => void;
  readonly onCancel: () => void;
}

export default function VehicleForm({
  initialValues,
  submitLabel,
  submitting,
  apiError,
  readOnly = false,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const theme = useTheme();
  const [form, setForm] = useState<VehicleFormValues>(initialValues ?? DEFAULT_VEHICLE_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VehicleFormValues, string>>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["year", "seats", "pricePerDay"].includes(name) ? Number(value) : value,
    }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmitClick = () => {
    if (readOnly) return;
    const result = vehicleFormSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<Record<keyof VehicleFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof VehicleFormValues;
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    onSubmit(result.data);
  };

  const fieldDisabled = readOnly || submitting;

  return (
    <Card
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Grid container spacing={3}>
        {/* Identity */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Make (Brand)"
            name="make"
            value={form.make}
            onChange={handleChange}
            error={!!fieldErrors.make}
            helperText={fieldErrors.make}
            disabled={fieldDisabled}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Model"
            name="model"
            value={form.model}
            onChange={handleChange}
            error={!!fieldErrors.model}
            helperText={fieldErrors.model}
            disabled={fieldDisabled}
          />
        </Grid>

        {/* Details */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="Year"
            name="year"
            value={form.year}
            onChange={handleChange}
            error={!!fieldErrors.year}
            helperText={fieldErrors.year}
            disabled={fieldDisabled}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
            error={!!fieldErrors.color}
            helperText={fieldErrors.color}
            disabled={fieldDisabled}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="License Plate"
            name="licensePlate"
            value={form.licensePlate}
            onChange={handleChange}
            error={!!fieldErrors.licensePlate}
            helperText={fieldErrors.licensePlate}
            disabled={fieldDisabled}
          />
        </Grid>

        {/* Specs */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Transmission"
            name="transmission"
            value={form.transmission}
            onChange={handleChange}
            disabled={fieldDisabled}
          >
            {TRANSMISSION_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            label="Fuel Type"
            name="fuelType"
            value={form.fuelType}
            onChange={handleChange}
            disabled={fieldDisabled}
          >
            {FUEL_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Capacity / pricing / location */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="Seats"
            name="seats"
            value={form.seats}
            onChange={handleChange}
            error={!!fieldErrors.seats}
            helperText={fieldErrors.seats}
            disabled={fieldDisabled}
            slotProps={{ htmlInput: { min: 1, max: 50 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="Price Per Day"
            name="pricePerDay"
            value={form.pricePerDay}
            onChange={handleChange}
            error={!!fieldErrors.pricePerDay}
            helperText={fieldErrors.pricePerDay}
            disabled={fieldDisabled}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 700, color: "primary.main" }}>$</Typography>
                  </InputAdornment>
                ),
              },
              htmlInput: { min: 0, step: "0.01" },
            }}
            sx={{
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" },
              "& input": { fontWeight: 600 },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="City"
            name="locationCity"
            value={form.locationCity}
            onChange={handleChange}
            error={!!fieldErrors.locationCity}
            helperText={fieldErrors.locationCity}
            disabled={fieldDisabled}
          />
        </Grid>

        {/* Description */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            name="description"
            value={form.description ?? ""}
            onChange={handleChange}
            error={!!fieldErrors.description}
            helperText={fieldErrors.description}
            disabled={fieldDisabled}
          />
        </Grid>

        {/* Image (single URL — first iteration) */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Vehicle image URL"
            name="imageUrl"
            placeholder="https://…/photo.jpg"
            value={form.imageUrl ?? ""}
            onChange={handleChange}
            error={!!fieldErrors.imageUrl}
            helperText={fieldErrors.imageUrl ?? "Paste the URL of one image. Multi-image upload is coming soon."}
            disabled={fieldDisabled}
          />
        </Grid>
      </Grid>

      {/* API error */}
      {apiError && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          {apiError}
        </Alert>
      )}

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mt: 5, justifyContent: "flex-end" }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={submitting}
          sx={{ borderRadius: 3, px: 4, fontWeight: 700, textTransform: "none" }}
        >
          Cancel
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSubmitClick}
            variant="contained"
            disabled={submitting}
            sx={{
              borderRadius: 3,
              px: 6,
              fontWeight: 700,
              textTransform: "none",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : submitLabel}
          </Button>
        )}
      </Stack>

      {/* Read-only notice tucked at the bottom so it never collides with field errors */}
      {readOnly && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            This vehicle is in a read-only state and cannot be edited.
          </Alert>
        </Box>
      )}
    </Card>
  );
}
