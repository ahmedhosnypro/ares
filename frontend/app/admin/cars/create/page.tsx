"use client";

import { useState, ChangeEvent } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  MenuItem,
  Alert,
  alpha,
  useTheme,
  InputAdornment,
} from "@mui/material";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createCar, type CarPayload } from "@/api-clients/cars/cars";

// 1. English Validation Schema
export const createCarSchema = z.object({
  make: z.string().min(2, "Make is required"),
  model: z.string().min(2, "Model is required"),
  year: z.number().min(1990, "Invalid year (min 1990)"),
  color: z.string().min(2, "Color is required"),
  licensePlate: z.string().min(3, "License plate is required"),
  transmission: z.string().min(1, "Selection is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  seats: z.number().min(1, "Seats are required"),
  pricePerDay: z.number().min(1, "Price must be greater than 0"),
  locationCity: z.string().min(2, "City is required"),
  description: z.string().min(5, "Description is too short"),
  status: z.string(), // This maps to Category in your table logic
  availabilityStatus: z.string(),
});

export default function CreateCarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: 2024,
    color: "",
    licensePlate: "",
    transmission: "Automatic",
    fuelType: "Gasoline",
    seats: 4,
    pricePerDay: 0,
    locationCity: "",
    description: "",
    status: "Sedan",
    availabilityStatus: "Available",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["year", "seats", "pricePerDay"].includes(name) ? Number(value) : value,
    }));
    // Clear error when user types
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    void (async () => {
      const result = createCarSchema.safeParse(form);

      if (!result.success) {
        const simplifiedErrors: Record<string, string | undefined> = {};
        result.error.issues.forEach(issue => {
          const key = issue.path[0] as string;
          if (!simplifiedErrors[key]) {
            simplifiedErrors[key] = issue.message;
          }
        });

        setFieldErrors(simplifiedErrors);
        return;
      }

      if (!session?.accessToken || !session.user.id) {
        setApiError("You must be logged in to create a vehicle");
        return;
      }

      try {
        setLoading(true);
        setApiError("");

        const payload: CarPayload = {
          userId: session.user.id,
          ...form,
        };

        await createCar(session.accessToken, payload);

        router.push("/admin/cars");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred while adding the vehicle";
        setApiError(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Stack sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }} gutterBottom>
          Add New Vehicle
        </Typography>
        <Typography color="text.secondary">Fill in the details to list a new car in the system</Typography>
      </Stack>

      <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={3}>
          {/* Car Identity */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Make (Brand)"
              name="make"
              value={form.make}
              onChange={handleChange}
              error={!!fieldErrors.make}
              helperText={fieldErrors.make}
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
            >
              <MenuItem value="Automatic">Automatic</MenuItem>
              <MenuItem value="Manual">Manual</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Fuel Type" name="fuelType" value={form.fuelType} onChange={handleChange}>
              <MenuItem value="Gasoline">Gasoline</MenuItem>
              <MenuItem value="Diesel">Diesel</MenuItem>
              <MenuItem value="Electric">Electric</MenuItem>
            </TextField>
          </Grid>

          {/* Pricing & Capacity */}
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
              slotProps={{ htmlInput: { min: 1 } }}
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
              slotProps={{
                htmlInput: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontWeight: "bold", color: "primary.main" }}>$</Typography>
                    </InputAdornment>
                  ),
                  min: 0,
                  step: "0.01",
                },
              }}
              sx={{
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                  display: "none",
                },
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
              value={form.description}
              onChange={handleChange}
              error={!!fieldErrors.description}
              helperText={fieldErrors.description}
            />
          </Grid>

          {/* Status (Category) Selectors */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Category" name="status" value={form.status} onChange={handleChange}>
              <MenuItem value="SUVs">SUVs</MenuItem>
              <MenuItem value="Sedan">Sedan</MenuItem>
              <MenuItem value="Compact">Compact</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Availability Status"
              name="availabilityStatus"
              value={form.availabilityStatus}
              onChange={handleChange}
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Rented">Rented</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* API Errors */}
        {apiError && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 5, justifyContent: "flex-end" }}>
          <Button
            onClick={() => {
              router.push("/admin/cars");
            }}
            variant="outlined"
            sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 3,
              px: 6,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create Vehicle"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
