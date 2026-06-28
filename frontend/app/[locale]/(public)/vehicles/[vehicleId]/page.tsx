import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Box, Typography } from "@mui/material";
import VehicleDetailsClient from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient";
import {
  type BookingLocationOption,
  type VehicleDetailsViewModel,
  type VehicleReviewViewModel,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/types";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface PageProps {
  readonly params: Promise<{ vehicleId: string }>;
}

interface ApiVehicleImageDto {
  readonly imageId?: string;
  readonly url?: string;
  readonly isPrimary?: boolean;
}

interface ApiVehicleFeatureDto {
  readonly id?: string;
  readonly featureName?: string;
  readonly featureDescription?: string;
}

interface ApiVehicleDto {
  readonly vehicleId?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly color?: string;
  readonly licensePlate?: string;
  readonly transmission?: string;
  readonly fuelType?: string;
  readonly seats?: number;
  readonly pricePerDay?: number;
  readonly originalPricePerDay?: number;
  readonly discountPercentage?: number;
  readonly locationCity?: string;
  readonly description?: string;
  readonly status?: string;
  readonly availabilityStatus?: string;
  readonly images?: readonly ApiVehicleImageDto[];
  readonly features?: readonly ApiVehicleFeatureDto[];
  readonly supplier?: {
    readonly id?: string;
    readonly name?: string;
  };
  readonly averageRating?: number;
  readonly reviewCount?: number;
  readonly categoryId?: string;
  readonly categoryName?: string;
}

interface ApiReviewDto {
  readonly reviewId?: string;
  readonly userName?: string;
  readonly rating?: number;
  readonly comment?: string;
  readonly supplierReply?: string;
  readonly repliedAt?: string;
  readonly createdAt?: string;
}

interface ApiLocationsResponse {
  readonly resultData?: readonly {
    readonly _id?: string;
    readonly name?: string;
    readonly city?: string;
  }[];
}

interface ApiPagedResponse<T> {
  readonly data?: readonly T[];
  readonly resultData?: readonly T[];
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeVehicle(vehicle: ApiVehicleDto): VehicleDetailsViewModel {
  return {
    vehicleId: asString(vehicle.vehicleId),
    make: asString(vehicle.make),
    model: asString(vehicle.model),
    year: asNumber(vehicle.year),
    color: asString(vehicle.color),
    licensePlate: asString(vehicle.licensePlate),
    transmission: asString(vehicle.transmission),
    fuelType: asString(vehicle.fuelType),
    seats: asNumber(vehicle.seats),
    pricePerDay: asNumber(vehicle.pricePerDay),
    originalPricePerDay: asNumber(vehicle.originalPricePerDay) || undefined,
    discountPercentage: asNumber(vehicle.discountPercentage) || undefined,
    locationCity: asString(vehicle.locationCity),
    description: asString(vehicle.description),
    status: asString(vehicle.status),
    availabilityStatus: asString(vehicle.availabilityStatus),
    images: (vehicle.images ?? [])
      .map(image => ({
        id: asString(image.imageId),
        imageUrl: asString(image.url),
        isPrimary: Boolean(image.isPrimary),
      }))
      .filter(image => image.imageUrl !== ""),
    features: (vehicle.features ?? [])
      .map(feature => ({
        id: asString(feature.id),
        featureName: asString(feature.featureName),
        featureDescription: asString(feature.featureDescription),
      }))
      .filter(feature => feature.featureName !== ""),
    supplierId: asString(vehicle.supplier?.id),
    supplierName: asString(vehicle.supplier?.name),
    averageRating: asNumber(vehicle.averageRating),
    reviewCount: asNumber(vehicle.reviewCount),
    categoryId: vehicle.categoryId ? asString(vehicle.categoryId) : undefined,
    categoryName: vehicle.categoryName ? asString(vehicle.categoryName) : undefined,
  };
}

function normalizeReviews(reviews: readonly ApiReviewDto[]): readonly VehicleReviewViewModel[] {
  return reviews.map(review => ({
    reviewId: asString(review.reviewId),
    userName: asString(review.userName, "Customer"),
    rating: asNumber(review.rating),
    comment: asString(review.comment),
    supplierReply: review.supplierReply ? asString(review.supplierReply) : undefined,
    repliedAt: review.repliedAt ? asString(review.repliedAt) : undefined,
    createdAt: asString(review.createdAt),
  }));
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

async function fetchVehicleDetails(vehicleId: string): Promise<VehicleDetailsViewModel | null> {
  const response = await fetch(toApiUrl(`/api/vehicles/${vehicleId}`), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as ApiVehicleDto;
  return normalizeVehicle(payload);
}

async function fetchVehicleReviews(vehicleId: string): Promise<readonly VehicleReviewViewModel[]> {
  const response = await fetch(toApiUrl(`/api/vehicles/${vehicleId}/reviews?page=1&pageSize=8&sortBy=date`), {
    cache: "no-store",
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as ApiPagedResponse<ApiReviewDto>;
  const reviews = payload.data ?? payload.resultData ?? [];
  return normalizeReviews(reviews);
}

async function fetchLocations(): Promise<readonly BookingLocationOption[]> {
  const response = await fetch(toApiUrl("/api/locations/1/50/en"), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as ApiLocationsResponse;
  return normalizeLocations(payload);
}

export default async function VehicleDetailsPage({ params }: PageProps) {
  const { vehicleId } = await params;

  const [session, pageData] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    (async () => {
      try {
        const [vehicle, reviews, locations] = await Promise.all([
          fetchVehicleDetails(vehicleId),
          fetchVehicleReviews(vehicleId),
          fetchLocations(),
        ]);
        return { vehicle, reviews, locations };
      } catch (error) {
        logger.error("Vehicle details page error", error);
        return null;
      }
    })(),
  ]);

  if (!pageData) {
    return (
      <Box component="main" sx={{ minHeight: "60vh", display: "grid", placeItems: "center", px: 2 }}>
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: "center" }}>
          We were unable to load this vehicle right now.
        </Typography>
      </Box>
    );
  }

  const { vehicle, reviews, locations } = pageData;

  if (!vehicle) {
    notFound();
  }

  const isAdmin = session?.user.roles.includes("Admin") ?? false;
  const isOwner = session?.user.id === vehicle.supplierId;
  const canEdit = isAdmin || isOwner;

  return <VehicleDetailsClient vehicle={vehicle} reviews={reviews} locations={locations} canEdit={canEdit} />;
}
