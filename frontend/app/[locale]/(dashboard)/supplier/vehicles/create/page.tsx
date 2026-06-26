import { Box, Typography, Container, IconButton, Stack } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { getServerSession } from "next-auth";
import { Link } from "@/shared/i18n/routing";
import SupplierCreateVehicleClient from "./SupplierCreateVehicleClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import type {
  BookingLocationOption,
  VehicleDetailsViewModel,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/types";

interface ApiLocationsResponse {
  readonly resultData?: readonly {
    readonly _id?: string;
    readonly name?: string;
    readonly city?: string;
  }[];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeLocations(payload: ApiLocationsResponse): readonly BookingLocationOption[] {
  return (payload.resultData ?? [])
    .map(location => ({
      id: asString(location._id),
      label: asString(location.name),
      city: asString(location.city),
    }))
    .filter(location => location.id !== "" && location.label !== "");
}

async function fetchLocations(): Promise<readonly BookingLocationOption[]> {
  const response = await fetch(toApiUrl("/api/locations/1/50/en"), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as ApiLocationsResponse;
  return normalizeLocations(payload);
}

export default async function CreateSupplierVehiclePage() {
  const [session, locations] = await Promise.all([getServerSession(authOptions), fetchLocations()]);

  const emptyVehicle: VehicleDetailsViewModel = {
    vehicleId: "",
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
    status: "", // Set as empty to force selection
    availabilityStatus: "Available",
    images: [],
    features: [],
    supplierId: session?.user.id ?? "",
    supplierName: "",
    averageRating: 0,
    reviewCount: 0,
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Container maxWidth="xl">
        <Stack direction="row" sx={{ alignItems: "center", mb: 2, mt: 2 }}>
          <Link href="/supplier/vehicles" style={{ textDecoration: "none" }}>
            <IconButton
              sx={{
                bgcolor: "background.paper",
                boxShadow: 1,
                mr: 2,
                "&:hover": { bgcolor: "background.paper", transform: "translateX(-3px)" },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
          </Link>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Create New Vehicle
          </Typography>
        </Stack>
      </Container>
      <SupplierCreateVehicleClient emptyVehicle={emptyVehicle} locations={locations} />
    </Box>
  );
}
