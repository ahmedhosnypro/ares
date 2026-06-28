"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import VehicleDetailsClient, {
  type FormValues,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient";
import { createCar, uploadCarImage, type CarPayload } from "@/api-clients/cars/cars";
import { logger } from "@/utils/logger";
import type {
  BookingLocationOption,
  VehicleDetailsViewModel,
} from "@/app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/types";

interface CreateVehicleClientProps {
  readonly emptyVehicle: VehicleDetailsViewModel;
  readonly locations: readonly BookingLocationOption[];
}

export default function CreateVehicleClient({ emptyVehicle, locations }: CreateVehicleClientProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSave = async (values: FormValues) => {
    if (!session?.accessToken) {
      throw new Error("You must be signed in to create a vehicle.");
    }
    const payload: CarPayload = {
      userId: session.user.id,
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
      description: values.description || "",
      status: values.status || "Sedan",
      availabilityStatus: values.availabilityStatus || "Available",
    };

    const resText = await createCar(session.accessToken, payload);

    // Extract vehicle ID from response
    const vehicleIdRegex = /[0-9a-fA-F-]{36}/;
    const vehicleIdMatch = vehicleIdRegex.exec(resText);
    const vehicleId = vehicleIdMatch ? vehicleIdMatch[0] : null;

    if (!vehicleId) {
      throw new Error("Failed to get vehicle ID from response");
    }

    // Upload images if any
    if (values.images.length > 0) {
      for (const img of values.images) {
        if (img.file) {
          try {
            await uploadCarImage(session.accessToken, vehicleId, img.file);
          } catch (uploadErr) {
            logger.error("Failed to upload image during creation", uploadErr);
          }
        }
      }
    }

    setTimeout(() => {
      router.push("/admin/vehicles");
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
      hideReviews
    />
  );
}
