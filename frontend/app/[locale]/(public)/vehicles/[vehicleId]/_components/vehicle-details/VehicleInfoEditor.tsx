"use client";

import { Divider, Grid, Stack, Typography, TextField, MenuItem, IconButton, Card, Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import {
  TRANSMISSION_OPTIONS,
  FUEL_OPTIONS,
} from "@/app/[locale]/(dashboard)/supplier/vehicles/_components/VehicleForm.schema";

export interface VehicleInfoEditorLabels {
  readonly sections: {
    readonly vehicleIdentity: string;
    readonly aboutVehicle: string;
    readonly specifications: string;
    readonly includedFeatures: string;
    readonly carSettings: string;
  };
  readonly fields: {
    readonly make: string;
    readonly model: string;
    readonly year: string;
    readonly color: string;
    readonly licensePlate: string;
    readonly description: string;
    readonly transmission: string;
    readonly fuelType: string;
    readonly seats: string;
    readonly pricePerDay: string;
    readonly locationCity: string;
    readonly category: string;
    readonly availabilityStatus: string;
    readonly approvalStatus: string;
    readonly featureName: string;
    readonly featureDescription: string;
  };
  readonly dropdowns: {
    readonly automatic: string;
    readonly manual: string;
    readonly gasoline: string;
    readonly diesel: string;
    readonly electric: string;
    readonly hybrid: string;
    readonly pluginHybrid: string;
    readonly available: string;
    readonly unavailable: string;
    readonly pendingReview: string;
    readonly approvedActive: string;
    readonly rejected: string;
  };
  readonly features: {
    readonly addFeature: string;
  };
}

const DEFAULT_LABELS: VehicleInfoEditorLabels = {
  sections: {
    vehicleIdentity: "Vehicle Identity",
    aboutVehicle: "About this vehicle",
    specifications: "Specifications",
    includedFeatures: "Included Features",
    carSettings: "Car Settings",
  },
  fields: {
    make: "Make",
    model: "Model",
    year: "Year",
    color: "Color",
    licensePlate: "License Plate",
    description: "Description",
    transmission: "Transmission",
    fuelType: "Fuel Type",
    seats: "Seats",
    pricePerDay: "Price Per Day ($)",
    locationCity: "Location City",
    category: "Category",
    availabilityStatus: "Availability Status",
    approvalStatus: "Approval Status (Admin Only)",
    featureName: "Feature Name",
    featureDescription: "Description",
  },
  dropdowns: {
    automatic: "Automatic",
    manual: "Manual",
    gasoline: "Gasoline",
    diesel: "Diesel",
    electric: "Electric",
    hybrid: "Hybrid",
    pluginHybrid: "PluginHybrid",
    available: "Available",
    unavailable: "Unavailable",
    pendingReview: "Pending Review",
    approvedActive: "Approved / Active",
    rejected: "Rejected",
  },
  features: {
    addFeature: "Add Feature",
  },
};

const TRANSMISSION_LABEL_KEYS = ["automatic", "manual"] as const;
const FUEL_LABEL_KEYS = ["gasoline", "diesel", "electric", "hybrid", "pluginHybrid"] as const;

export default function VehicleInfoEditor({
  isAdmin,
  categories = [],
  labels = DEFAULT_LABELS,
}: {
  readonly isAdmin: boolean;
  readonly categories?: readonly { id: string; name: string }[];
  readonly labels?: VehicleInfoEditorLabels;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const {
    fields: featureFields,
    append: addFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: "features",
  });

  return (
    <Stack spacing={4}>
      <Stack spacing={2.5}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          {labels.sections.vehicleIdentity}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="make"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={labels.fields.make}
                  fullWidth
                  error={!!errors.make}
                  helperText={errors.make?.message as string}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={labels.fields.model}
                  fullWidth
                  error={!!errors.model}
                  helperText={errors.model?.message as string}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label={labels.fields.year}
                  fullWidth
                  onChange={e => {
                    field.onChange(Number(e.target.value));
                  }}
                  error={!!errors.year}
                  helperText={errors.year?.message as string}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={labels.fields.color}
                  fullWidth
                  error={!!errors.color}
                  helperText={errors.color?.message as string}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="licensePlate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={labels.fields.licensePlate}
                  fullWidth
                  error={!!errors.licensePlate}
                  helperText={errors.licensePlate?.message as string}
                />
              )}
            />
          </Grid>
        </Grid>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          {labels.sections.aboutVehicle}
        </Typography>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              multiline
              rows={4}
              label={labels.fields.description}
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message as string}
            />
          )}
        />
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          {labels.sections.specifications}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label={labels.fields.transmission} fullWidth>
                  {TRANSMISSION_OPTIONS.map((opt, i) => (
                    <MenuItem key={opt} value={opt}>
                      {labels.dropdowns[TRANSMISSION_LABEL_KEYS[i]]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="fuelType"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label={labels.fields.fuelType} fullWidth>
                  {FUEL_OPTIONS.map((opt, i) => (
                    <MenuItem key={opt} value={opt}>
                      {labels.dropdowns[FUEL_LABEL_KEYS[i]]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="seats"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label={labels.fields.seats}
                  fullWidth
                  onChange={e => {
                    field.onChange(Number(e.target.value));
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="pricePerDay"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label={labels.fields.pricePerDay}
                  fullWidth
                  onChange={e => {
                    field.onChange(Number(e.target.value));
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="locationCity"
              control={control}
              render={({ field }) => <TextField {...field} label={labels.fields.locationCity} fullWidth />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={labels.fields.category}
                  fullWidth
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message as string}
                  disabled={categories.length === 0}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            {labels.sections.includedFeatures}
          </Typography>
          <Button
            startIcon={<AddRoundedIcon />}
            size="small"
            onClick={() => {
              addFeature({ featureName: "", featureDescription: "", featureCategory: "General" });
            }}
          >
            {labels.features.addFeature}
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {featureFields.map((field, index) => (
            <Grid key={field.id} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ p: 2, position: "relative" }}>
                <IconButton
                  size="small"
                  color="error"
                  sx={{ position: "absolute", top: 4, right: 4 }}
                  onClick={() => {
                    removeFeature(index);
                  }}
                >
                  <DeleteRoundedIcon fontSize="small" />
                </IconButton>
                <Stack spacing={1.5}>
                  <Controller
                    name={`features.${index}.featureName`}
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label={labels.fields.featureName} size="small" fullWidth />
                    )}
                  />
                  <Controller
                    name={`features.${index}.featureDescription`}
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label={labels.fields.featureDescription} size="small" fullWidth />
                    )}
                  />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          {labels.sections.carSettings}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="availabilityStatus"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label={labels.fields.availabilityStatus} fullWidth>
                  <MenuItem value="Available">{labels.dropdowns.available}</MenuItem>
                  <MenuItem value="Unavailable">{labels.dropdowns.unavailable}</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          {isAdmin && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label={labels.fields.approvalStatus} fullWidth>
                    <MenuItem value="Pending">{labels.dropdowns.pendingReview}</MenuItem>
                    <MenuItem value="Approved">{labels.dropdowns.approvedActive}</MenuItem>
                    <MenuItem value="Rejected">{labels.dropdowns.rejected}</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          )}
        </Grid>
      </Stack>
    </Stack>
  );
}
