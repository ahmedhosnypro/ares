"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Fab,
  Zoom,
  Snackbar,
  useTheme,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import RedoRoundedIcon from "@mui/icons-material/RedoRounded";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "@/shared/i18n/routing";
import { useFormUndoRedo } from "./useFormUndoRedo";
import Gallery from "./Gallery";
import GalleryEditor from "./GalleryEditor";
import VehicleInfo from "./VehicleInfo";
import VehicleInfoEditor from "./VehicleInfoEditor";
import ReviewSection from "./ReviewSection";
import BookingCard from "./BookingCard";
import VerificationRequiredCard from "./VerificationRequiredCard";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import {
  updateVehicle,
  updateSupplierVehicle,
  uploadVehicleImage,
  type UpdateSupplierVehiclePayload,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { createCar, uploadCarImage, type CarPayload } from "@/api-clients/cars/cars";
import { getCategories, type Category } from "@/api-clients/categories/categories";
import { logger } from "@/utils/logger";
import { ApiError } from "@/utils/api-client";
import type { VehicleDetailsViewModel, VehicleReviewViewModel, BookingLocationOption } from "./types";

const schema = z.object({
  make: z.string().trim().min(2, "Make is required"),
  model: z.string().trim().min(2, "Model is required"),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  color: z.string().trim().min(2, "Color is required"),
  licensePlate: z.string().trim().min(2, "License plate is required"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  seats: z.number().int().min(1, "At least 1 seat required").max(50),
  pricePerDay: z.number().min(0.01, "Price must be greater than 0"),
  locationCity: z.string().trim().min(2, "City is required"),
  description: z.string().optional(),
  images: z.array(
    z.object({
      url: z.string().min(1, "Image URL is required"),
      isPrimary: z.boolean(),
      file: z.instanceof(File).optional(),
    })
  ),
  features: z.array(
    z.object({
      featureName: z.string().min(1, "Feature name is required"),
      featureDescription: z.string().optional(),
      featureCategory: z.string().optional(),
    })
  ),
  status: z.string().optional(),
  availabilityStatus: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
});

export type FormValues = z.infer<typeof schema>;

interface VehicleDetailsClientProps {
  readonly vehicle: VehicleDetailsViewModel;
  readonly reviews: readonly VehicleReviewViewModel[];
  readonly locations: readonly BookingLocationOption[];
  readonly canEdit: boolean;
  readonly isCreateMode?: boolean;
  readonly onSave?: (values: FormValues) => Promise<void>;
}

export default function VehicleDetailsClient({
  vehicle,
  reviews,
  locations,
  canEdit,
  isCreateMode = false,
  onSave,
}: VehicleDetailsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  const isAdmin = session?.user.roles.includes("Admin") ?? false;

  const [categories, setCategories] = useState<readonly Category[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await getCategories();
        if (active) {
          setCategories(data.filter(c => c.isActive));
        }
      } catch (err) {
        logger.error("Failed to load categories", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const initialValues: FormValues = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    licensePlate: vehicle.licensePlate,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    seats: vehicle.seats,
    pricePerDay: vehicle.pricePerDay,
    locationCity: vehicle.locationCity,
    description: vehicle.description,
    images: vehicle.images.map(img => ({ url: img.imageUrl, isPrimary: img.isPrimary })),
    features: vehicle.features.map(f => ({
      featureName: f.featureName,
      featureDescription: f.featureDescription,
      featureCategory: "General",
    })),
    status: vehicle.status,
    availabilityStatus: vehicle.availabilityStatus,
    categoryId: "",
  };

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (categories.length > 0) {
      const matched = categories.find(
        c => c.name.toLowerCase() === vehicle.status?.toLowerCase() || c.id === vehicle.status
      );
      if (matched) {
        methods.setValue("categoryId", matched.id);
      } else if (isCreateMode && !methods.getValues("categoryId")) {
        const sedan = categories.find(c => c.name.toLowerCase() === "sedan");
        if (sedan) {
          methods.setValue("categoryId", sedan.id);
        } else if (categories[0]) {
          methods.setValue("categoryId", categories[0].id);
        }
      }
    }
  }, [categories, vehicle.status, isCreateMode, methods]);

  const { undo, redo, canUndo, canRedo } = useFormUndoRedo(methods, initialValues);

  const {
    handleSubmit,
    formState: { isDirty },
  } = methods;

  const onSubmit = async (values: FormValues) => {
    if (!session?.accessToken) return;
    setSubmitting(true);
    setSaveError(null);

    try {
      if (onSave) {
        await onSave(values);
        if (!isCreateMode) {
          // Reset form fields state to clear dirty state
          methods.reset(values);
        }
        setSuccessToastOpen(true);
      } else {
        if (isCreateMode) {
          // Create mode: Create the vehicle first
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

          setSuccessToastOpen(true);
          setTimeout(() => {
            router.push("/admin/vehicles");
          }, 800);
        } else {
          // Update mode: existing logic
          // 1. Upload new files if any
          const updatedImages = await Promise.all(
            values.images.map(async img => {
              if (img.file) {
                try {
                  const res = await uploadVehicleImage(session.accessToken, vehicle.vehicleId, img.file, isAdmin);
                  // Revoke the temp blob URL
                  if (img.url.startsWith("blob:")) {
                    URL.revokeObjectURL(img.url);
                  }
                  // Return in camelCase to match standard JSON serialization
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
          const cleanFeatures = values.features.map(f => ({
            featureName: f.featureName,
            featureDescription: f.featureDescription,
            featureCategory: f.featureCategory,
          }));

          const finalValues: UpdateSupplierVehiclePayload = {
            ...values,
            images: updatedImages,
            features: cleanFeatures,
          };

          if (isAdmin) {
            await updateVehicle(session.accessToken, vehicle.vehicleId, finalValues);
          } else {
            await updateSupplierVehicle(session.accessToken, vehicle.vehicleId, finalValues);
          }

          // Update the form's initial values to match what was just saved
          // so that isDirty becomes false and the "Save All Changes" bar disappears
          methods.reset(finalValues);
          setSuccessToastOpen(true);
        }
      }
    } catch (err: unknown) {
      handleOnSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnSubmitError = (err: unknown) => {
    if (err instanceof ApiError) {
      let msg = err.message;

      try {
        const errorData = JSON.parse(err.body) as {
          detail?: string;
          message?: string;
          errors?: Record<string, string[]>;
        };
        const detail = errorData.detail || errorData.message;
        const validationErrors = errorData.errors ? Object.values(errorData.errors).flat().join(", ") : null;

        if (validationErrors) {
          msg = `Validation failed: ${validationErrors}`;
        } else if (detail) {
          msg = detail;
        }
        logger.error("Failed to update vehicle (API)", msg, errorData);
      } catch {
        logger.error("Failed to update vehicle (API)", msg, err.body);
      }

      setSaveError(msg);
    } else if (err instanceof Error) {
      logger.error("Failed to update vehicle", err.message);
      setSaveError(err.message);
    } else {
      logger.error("Failed to update vehicle", "Unknown error");
      setSaveError("Unknown error occurred while updating the vehicle");
    }
  };

  const verification = useVerificationStatus();

  return (
    <FormProvider {...methods}>
      <Box component="main" sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 }, pb: 12 }}>
        <Container maxWidth="xl">
          {saveError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {saveError}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ justifyContent: canEdit ? "center" : "flex-start" }}>
            <Grid size={{ xs: 12, lg: canEdit ? 10 : 8 }}>
              <Stack spacing={3}>
                {!canEdit && !verification.isApproved && (
                  <VerificationRequiredCard
                    status={verification.status}
                    loading={verification.loading}
                    error={verification.error}
                  />
                )}

                <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                  {canEdit ? (
                    <GalleryEditor />
                  ) : (
                    <Gallery images={vehicle.images} vehicleLabel={`${vehicle.make} ${vehicle.model}`} />
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}
                >
                  {canEdit ? (
                    <VehicleInfoEditor isAdmin={isAdmin} categories={categories} />
                  ) : (
                    <VehicleInfo vehicle={vehicle} />
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}
                >
                  <ReviewSection reviews={reviews} />
                </Paper>
              </Stack>
            </Grid>

            {!canEdit && (
              <Grid size={{ xs: 12, lg: 4 }}>
                <Box sx={{ position: { lg: "sticky" }, top: { lg: 96 } }}>
                  <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <BookingCard vehicle={vehicle} locationOptions={locations} />
                  </Paper>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>

        {canEdit && (
          <Zoom in={isCreateMode || isDirty}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                position: "fixed",
                bottom: 32,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
              }}
            >
              <Fab
                variant="extended"
                color="secondary"
                onClick={undo}
                disabled={!canUndo || submitting}
                sx={{ px: 3, fontWeight: 700, boxShadow: theme.shadows[10] }}
              >
                <UndoRoundedIcon sx={{ mr: 1 }} />
                Undo
              </Fab>

              <Fab
                variant="extended"
                color="primary"
                onClick={e => {
                  e.preventDefault();
                  void handleSubmit(onSubmit)();
                }}
                disabled={submitting}
                sx={{
                  px: 4,
                  fontWeight: 700,
                  boxShadow: theme.shadows[10],
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                ) : (
                  <SaveRoundedIcon sx={{ mr: 1 }} />
                )}
                {isCreateMode ? "Create Vehicle" : "Save All Changes"}
              </Fab>

              <Fab
                variant="extended"
                color="secondary"
                onClick={redo}
                disabled={!canRedo || submitting}
                sx={{ px: 3, fontWeight: 700, boxShadow: theme.shadows[10] }}
              >
                Redo
                <RedoRoundedIcon sx={{ ml: 1 }} />
              </Fab>
            </Stack>
          </Zoom>
        )}
      </Box>
      <Snackbar
        open={successToastOpen}
        autoHideDuration={4000}
        onClose={() => {
          setSuccessToastOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => {
            setSuccessToastOpen(false);
          }}
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {isCreateMode ? "Vehicle created successfully" : "Vehicle updated successfully"}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}
