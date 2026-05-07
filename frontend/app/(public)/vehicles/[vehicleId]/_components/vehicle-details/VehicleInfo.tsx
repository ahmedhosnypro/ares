import { Box, Chip, Divider, Grid, Rating, Stack, Typography } from "@mui/material";
import type { VehicleDetailsViewModel } from "./types";

interface VehicleInfoProps {
  readonly vehicle: VehicleDetailsViewModel;
}

interface SpecItem {
  readonly label: string;
  readonly value: string;
}

function buildSpecs(vehicle: VehicleDetailsViewModel): readonly SpecItem[] {
  return [
    { label: "Transmission", value: vehicle.transmission },
    { label: "Fuel Type", value: vehicle.fuelType },
    { label: "Seats", value: String(vehicle.seats) },
    { label: "Color", value: vehicle.color },
    { label: "Category", value: vehicle.status },
    { label: "Location", value: vehicle.locationCity },
  ].filter(item => item.value !== "");
}

export default function VehicleInfo({ vehicle }: VehicleInfoProps) {
  const title = `${vehicle.make} ${vehicle.model}`.trim();
  const specs = buildSpecs(vehicle);
  const isAvailable = vehicle.availabilityStatus.toLowerCase() === "available";

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800 }}>
            {title || "Vehicle Details"}
          </Typography>
          <Chip
            label={isAvailable ? "Available now" : vehicle.availabilityStatus || "Unavailable"}
            color={isAvailable ? "success" : "default"}
            variant={isAvailable ? "filled" : "outlined"}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Rating value={vehicle.averageRating} precision={0.5} readOnly />
          <Typography variant="body2" color="text.secondary">
            {vehicle.averageRating.toFixed(1)} ({vehicle.reviewCount} reviews)
          </Typography>
        </Stack>

        {vehicle.year > 0 ? (
          <Typography variant="body1" color="text.secondary">
            Model year {vehicle.year}
          </Typography>
        ) : null}
      </Stack>

      <Divider />

      <Stack spacing={1}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          About this vehicle
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {vehicle.description || "Vehicle description is currently unavailable."}
        </Typography>
      </Stack>

      {specs.length > 0 ? (
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Key specifications
          </Typography>
          <Grid container spacing={1.5}>
            {specs.map(spec => (
              <Grid key={spec.label} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: "background.default",
                    height: "100%",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {spec.label}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ fontWeight: 700 }}>
                    {spec.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      ) : null}

      {vehicle.features.length > 0 ? (
        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Included features
          </Typography>
          <Grid container spacing={1.5}>
            {vehicle.features.map(feature => (
              <Grid key={feature.id || feature.featureName} size={{ xs: 12, sm: 6 }}>
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                    {feature.featureName}
                  </Typography>
                  {feature.featureDescription ? (
                    <Typography variant="body2" color="text.secondary">
                      {feature.featureDescription}
                    </Typography>
                  ) : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      ) : null}

      {vehicle.supplierName ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            "& .supplierName": {
              color: "text.primary",
              fontWeight: 700,
            },
          }}
        >
          Listed by <span className="supplierName">{vehicle.supplierName}</span>
        </Typography>
      ) : null}
    </Stack>
  );
}
