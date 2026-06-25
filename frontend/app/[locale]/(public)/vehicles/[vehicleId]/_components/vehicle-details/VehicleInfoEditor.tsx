"use client";

import { Divider, Grid, Stack, Typography, TextField, MenuItem, IconButton, Card, Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import {
  TRANSMISSION_OPTIONS,
  FUEL_OPTIONS,
} from "@/app/[locale]/(dashboard)/supplier/vehicles/_components/VehicleForm.schema";

export default function VehicleInfoEditor({
  isAdmin,
  categories = [],
}: {
  readonly isAdmin: boolean;
  readonly categories?: readonly { id: string; name: string }[];
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
      {/* Title & Basic Details */}
      <Stack spacing={2.5}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          Vehicle Identity
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="make"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Make"
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
                  label="Model"
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
                  label="Year"
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
                  label="Color"
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
                  label="License Plate"
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

      {/* Description */}
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          About this vehicle
        </Typography>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              multiline
              rows={4}
              label="Description"
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message as string}
            />
          )}
        />
      </Stack>

      <Divider />

      {/* Specifications */}
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          Specifications
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Transmission" fullWidth>
                  {TRANSMISSION_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
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
                <TextField {...field} select label="Fuel Type" fullWidth>
                  {FUEL_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
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
                  label="Seats"
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
                  label="Price Per Day ($)"
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
              render={({ field }) => <TextField {...field} label="Location City" fullWidth />}
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
                  label="Category"
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

      {/* Features */}
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            Included Features
          </Typography>
          <Button
            startIcon={<AddRoundedIcon />}
            size="small"
            onClick={() => {
              addFeature({ featureName: "", featureDescription: "", featureCategory: "General" });
            }}
          >
            Add Feature
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
                    render={({ field }) => <TextField {...field} label="Feature Name" size="small" fullWidth />}
                  />
                  <Controller
                    name={`features.${index}.featureDescription`}
                    control={control}
                    render={({ field }) => <TextField {...field} label="Description" size="small" fullWidth />}
                  />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Divider />

      {/* Car Settings */}
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
          Car Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="availabilityStatus"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Availability Status" fullWidth>
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Unavailable">Unavailable</MenuItem>
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
                  <TextField {...field} select label="Approval Status (Admin Only)" fullWidth>
                    <MenuItem value="Pending">Pending Review</MenuItem>
                    <MenuItem value="Approved">Approved / Active</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
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
