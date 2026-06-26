"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import VehicleDetailsClient, {
  type FormValues,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient";
import {
  createSupplierVehicle,
  uploadVehicleImage,
  type CreateSupplierVehiclePayload,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { logger } from "@/utils/logger";
import type {
  BookingLocationOption,
  VehicleDetailsViewModel,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/types";

interface SupplierCreateVehicleClientProps {
  readonly emptyVehicle: VehicleDetailsViewModel;
  readonly locations: readonly BookingLocationOption[];
}

export default function SupplierCreateVehicleClient({ emptyVehicle, locations }: SupplierCreateVehicleClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSave = async (values: FormValues) => {
    if (!session?.accessToken) {
      throw new Error("You must be signed in to create a vehicle.");
    }

    const payload: CreateSupplierVehiclePayload = {
      make: values.make,
      model: values.model,
      year: values.year,
      color: values.color,
      licensePlate: values.licensePlate,
      transmission: values.transmission,
      fuelType: values.fuelType,
      seats: values.seats,
      pricePerDay: values.pricePerDay,
      locationCity: values.locationCity,
      categoryId: values.categoryId, // Pass categoryId from form dropdown
      description: values.description?.trim() ? values.description : undefined,
      imageUrl: undefined, // Handled separately by upload
    };

    const response = await createSupplierVehicle(session.accessToken, payload);

    if (!response.vehicleId) {
      throw new Error("Failed to get vehicle ID from response");
    }

    // Upload images if any
    if (values.images.length > 0) {
      for (const img of values.images) {
        if (img.file) {
          try {
            await uploadVehicleImage(session.accessToken, response.vehicleId, img.file, false);
          } catch (uploadErr) {
            logger.error("Failed to upload image during creation", uploadErr);
          }
        }
      }
    }

    setTimeout(() => {
      router.push("/supplier/vehicles");
    }, 800);
  };

  return (
    <VehicleDetailsClient
      vehicle={emptyVehicle}
      reviews={[]}
      locations={locations}
      canEdit
      isCreateMode
      onSave={handleSave}
    />
  );
}
