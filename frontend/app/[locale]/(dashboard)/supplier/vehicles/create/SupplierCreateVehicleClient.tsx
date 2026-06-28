"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.createSupplierVehicle");

  const handleSave = async (values: FormValues) => {
    if (!session?.accessToken) {
      throw new Error(t("errors.notSignedIn"));
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
      categoryId: values.categoryId,
      description: values.description?.trim() ? values.description : undefined,
      imageUrl: undefined,
    };

    const response = await createSupplierVehicle(session.accessToken, payload);

    if (!response.vehicleId) {
      throw new Error(t("errors.vehicleIdNotFound"));
    }

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
      labels={{
        fab: {
          undo: t("fab.undo"),
          create: t("fab.create"),
          saveAll: t("fab.saveAll"),
          redo: t("fab.redo"),
        },
        toast: {
          created: t("toast.created"),
          updated: t("toast.updated"),
        },
        errors: {
          unknownUpdateError: t("errors.unknownUpdateError"),
          validationFailed: t("errors.validationFailed"),
        },
        galleryEditor: {
          alt: t("gallery.alt"),
          noImageSelected: t("gallery.noImageSelected"),
          featuredImage: t("gallery.featuredImage"),
          setAsFeatured: t("gallery.setAsFeatured"),
          noPreview: t("gallery.noPreview"),
          add: t("gallery.add"),
          fileSizeError: t("gallery.fileSizeError"),
        },
        vehicleInfoEditor: {
          sections: {
            vehicleIdentity: t("sections.vehicleIdentity"),
            aboutVehicle: t("sections.aboutVehicle"),
            specifications: t("sections.specifications"),
            includedFeatures: t("sections.includedFeatures"),
            carSettings: t("sections.carSettings"),
          },
          fields: {
            make: t("fields.make"),
            model: t("fields.model"),
            year: t("fields.year"),
            color: t("fields.color"),
            licensePlate: t("fields.licensePlate"),
            description: t("fields.description"),
            transmission: t("fields.transmission"),
            fuelType: t("fields.fuelType"),
            seats: t("fields.seats"),
            pricePerDay: t("fields.pricePerDay"),
            locationCity: t("fields.locationCity"),
            category: t("fields.category"),
            availabilityStatus: t("fields.availabilityStatus"),
            approvalStatus: t("fields.approvalStatus"),
            featureName: t("fields.featureName"),
            featureDescription: t("fields.featureDescription"),
          },
          dropdowns: {
            automatic: t("dropdowns.automatic"),
            manual: t("dropdowns.manual"),
            gasoline: t("dropdowns.gasoline"),
            diesel: t("dropdowns.diesel"),
            electric: t("dropdowns.electric"),
            hybrid: t("dropdowns.hybrid"),
            pluginHybrid: t("dropdowns.pluginHybrid"),
            available: t("dropdowns.available"),
            unavailable: t("dropdowns.unavailable"),
            pendingReview: t("dropdowns.pendingReview"),
            approvedActive: t("dropdowns.approvedActive"),
            rejected: t("dropdowns.rejected"),
          },
          features: {
            addFeature: t("features.addFeature"),
          },
        },
        validation: {
          makeRequired: t("validation.makeRequired"),
          modelRequired: t("validation.modelRequired"),
          yearWholeNumber: t("validation.yearWholeNumber"),
          yearMin: t("validation.yearMin"),
          yearMax: t("validation.yearMax"),
          colorRequired: t("validation.colorRequired"),
          licensePlateRequired: t("validation.licensePlateRequired"),
          fuelTypeRequired: t("validation.fuelTypeRequired"),
          seatsMin: t("validation.seatsMin"),
          seatsMax: t("validation.seatsMax"),
          priceMin: t("validation.priceMin"),
          cityRequired: t("validation.cityRequired"),
          categoryRequired: t("validation.categoryRequired"),
          transmissionRequired: t("validation.transmissionRequired"),
        },
      }}
    />
  );
}
