"use client";

import { useSession } from "next-auth/react";
import VehicleDetailsClient from "@/app/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient";
import { updateSupplierVehicle, uploadVehicleImage } from "@/api-clients/supplier-vehicles/supplier-vehicles";
import type {
  BookingLocationOption,
  VehicleDetailsViewModel,
  VehicleReviewViewModel,
} from "@/app/(public)/vehicles/[vehicleId]/_components/vehicle-details/types";
import { logger } from "@/utils/logger";

interface SupplierVehicleDetailsClientProps {
  readonly vehicle: VehicleDetailsViewModel;
  readonly reviews: readonly VehicleReviewViewModel[];
  readonly locations: readonly BookingLocationOption[];
  readonly canEdit: boolean;
}

export default function SupplierVehicleDetailsClient({
  vehicle,
  reviews,
  locations,
  canEdit,
}: SupplierVehicleDetailsClientProps) {
  const { data: session } = useSession();

  const handleSave = async (values: any) => {
    if (!session?.accessToken) {
      throw new Error("You must be signed in to save changes.");
    }

    // 1. Upload new files if any
    const updatedImages = await Promise.all(
      values.images.map(async (img: any) => {
        if (img.file) {
          try {
            // isAdminFlow is false for supplier edit
            const res = await uploadVehicleImage(session.accessToken, vehicle.vehicleId, img.file, false);
            if (img.url.startsWith("blob:")) {
              URL.revokeObjectURL(img.url);
            }
            return { url: res.url, isPrimary: img.isPrimary };
          } catch (uploadErr) {
            logger.error("Failed to upload image during update", uploadErr);
            throw new Error("Failed to upload one or more images. Please try again.", { cause: uploadErr });
          }
        }
        return { url: img.url, isPrimary: img.isPrimary };
      })
    );

    // 2. Clean up features (remove internal 'id' from useFieldArray)
    const cleanFeatures = values.features.map((f: any) => ({
      featureName: f.featureName,
      featureDescription: f.featureDescription,
      featureCategory: f.featureCategory,
    }));

    const finalValues = {
      ...values,
      images: updatedImages,
      features: cleanFeatures,
    };

    await updateSupplierVehicle(session.accessToken, vehicle.vehicleId, finalValues);
  };

  return (
    <VehicleDetailsClient
      vehicle={vehicle}
      reviews={reviews}
      locations={locations}
      canEdit={canEdit}
      onSave={handleSave}
    />
  );
}
