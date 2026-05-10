import { z } from "zod";

// ── Validation ────────────────────────────────────────────────────────────────
// Matches the FluentValidation rules on the backend
// (`CreateSupplierVehicleRequestValidator`).
export const vehicleFormSchema = z.object({
  make: z.string().trim().min(2, "Make is required"),
  model: z.string().trim().min(2, "Model is required"),
  year: z
    .number()
    .int("Year must be a whole number")
    .min(1901, "Year must be later than 1900")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().trim().min(2, "Color is required"),
  licensePlate: z.string().trim().min(2, "License plate is required").max(50),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.string().min(1, "Fuel type is required"),
  seats: z.number().int().min(1, "Seats must be at least 1").max(50, "Seats must not exceed 50"),
  pricePerDay: z.number().min(0.01, "Price per day must be greater than 0"),
  locationCity: z.string().trim().min(2, "City is required"),
  description: z.string().optional(),
  imageUrl: z
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

// ── Dropdown options ──────────────────────────────────────────────────────────
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
};
