import { z } from "zod";
import { useTranslations } from "next-intl";

const vehicleFormSchemaBase = z.object({
  make: z.string().trim().min(2),
  model: z.string().trim().min(2),
  year: z
    .number()
    .int()
    .min(1901)
    .max(new Date().getFullYear() + 1),
  color: z.string().trim().min(2),
  licensePlate: z.string().trim().min(2).max(50),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.string().min(1),
  seats: z.number().int().min(1).max(50),
  pricePerDay: z.number().min(0.01),
  locationCity: z.string().trim().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchemaBase>;

export interface VehicleFormValidationLabels {
  readonly makeRequired: string;
  readonly modelRequired: string;
  readonly yearWholeNumber: string;
  readonly yearMin: string;
  readonly yearMax: string;
  readonly colorRequired: string;
  readonly licensePlateRequired: string;
  readonly fuelTypeRequired: string;
  readonly seatsMin: string;
  readonly seatsMax: string;
  readonly priceMin: string;
  readonly cityRequired: string;
  readonly categoryRequired: string;
  readonly transmissionRequired: string;
}

export function createVehicleFormSchema(v: VehicleFormValidationLabels) {
  return vehicleFormSchemaBase.extend({
    make: z.string().trim().min(2, v.makeRequired),
    model: z.string().trim().min(2, v.modelRequired),
    year: z
      .number()
      .int(v.yearWholeNumber)
      .min(1901, v.yearMin)
      .max(new Date().getFullYear() + 1, v.yearMax),
    color: z.string().trim().min(2, v.colorRequired),
    licensePlate: z.string().trim().min(2, v.licensePlateRequired).max(50),
    fuelType: z.string().min(1, v.fuelTypeRequired),
    seats: z.number().int().min(1, v.seatsMin).max(50, v.seatsMax),
    pricePerDay: z.number().min(0.01, v.priceMin),
    locationCity: z.string().trim().min(2, v.cityRequired),
    categoryId: z.string().min(1, v.categoryRequired),
  });
}

export function useVehicleFormSchema() {
  const t = useTranslations("dashboard.createSupplierVehicle.validation");

  return createVehicleFormSchema({
    makeRequired: t("makeRequired"),
    modelRequired: t("modelRequired"),
    yearWholeNumber: t("yearWholeNumber"),
    yearMin: t("yearMin"),
    yearMax: t("yearMax"),
    colorRequired: t("colorRequired"),
    licensePlateRequired: t("licensePlateRequired"),
    fuelTypeRequired: t("fuelTypeRequired"),
    seatsMin: t("seatsMin"),
    seatsMax: t("seatsMax"),
    priceMin: t("priceMin"),
    cityRequired: t("cityRequired"),
    categoryRequired: t("categoryRequired"),
    transmissionRequired: t("transmissionRequired"),
  });
}

export const TRANSMISSION_OPTIONS = ["Automatic", "Manual"] as const;
export const FUEL_OPTIONS = ["Gasoline", "Diesel", "Electric", "Hybrid", "PluginHybrid"] as const;

export const DEFAULT_VEHICLE_FORM: VehicleFormValues = {
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
  imageUrl: "",
  categoryId: "",
};
