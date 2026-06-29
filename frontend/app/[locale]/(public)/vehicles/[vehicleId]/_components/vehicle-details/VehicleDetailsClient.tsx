"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/routing";
import { useFormUndoRedo } from "./useFormUndoRedo";
import Gallery from "./Gallery";
import GalleryEditor, { type GalleryEditorLabels } from "./GalleryEditor";
import VehicleInfo from "./VehicleInfo";
import VehicleInfoEditor, { type VehicleInfoEditorLabels } from "./VehicleInfoEditor";
import ReviewSection from "./ReviewSection";
import BookingCard from "./BookingCard";
import VerificationRequiredCard from "./VerificationRequiredCard";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import type { VehicleFormValidationLabels } from "@/app/[locale]/(dashboard)/supplier/vehicles/_components/VehicleForm.schema";
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

function buildSchema(v?: VehicleFormValidationLabels) {
  return z.object({
    make: z
      .string()
      .trim()
      .min(2, v?.makeRequired ?? "Make is required"),
    model: z
      .string()
      .trim()
      .min(2, v?.modelRequired ?? "Model is required"),
    year: z
      .number()
      .int(v?.yearWholeNumber)
      .min(1900, v?.yearMin)
      .max(new Date().getFullYear() + 1, v?.yearMax),
    color: z
      .string()
      .trim()
      .min(2, v?.colorRequired ?? "Color is required"),
    licensePlate: z
      .string()
      .trim()
      .min(2, v?.licensePlateRequired ?? "License plate is required"),
    transmission: z.string().min(1, v?.transmissionRequired ?? "Transmission is required"),
    fuelType: z.string().min(1, v?.fuelTypeRequired ?? "Fuel type is required"),
    seats: z
      .number()
      .int()
      .min(1, v?.seatsMin ?? "At least 1 seat required")
      .max(50, v?.seatsMax),
    pricePerDay: z.number().min(0.01, v?.priceMin ?? "Price must be greater than 0"),
    locationCity: z
      .string()
      .trim()
      .min(2, v?.cityRequired ?? "City is required"),
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
    categoryId: z.string().min(1, v?.categoryRequired ?? "Category is required"),
  });
}

const _defaultSchema = buildSchema();

export type FormValues = z.infer<typeof _defaultSchema>;

interface VehicleDetailsClientProps {
  readonly vehicle: VehicleDetailsViewModel;
  readonly reviews: readonly VehicleReviewViewModel[];
  readonly locations: readonly BookingLocationOption[];
  readonly canEdit: boolean;
  readonly isCreateMode?: boolean;
  readonly onSave?: (values: FormValues) => Promise<void>;
  readonly hideReviews?: boolean;
}

export default function VehicleDetailsClient({
  vehicle,
  reviews,
  locations,
  canEdit,
  isCreateMode = false,
  onSave,
  hideReviews = false,
}: VehicleDetailsClientProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.vehicles");
  const tv = useTranslations("dashboardAdmin.vehicles.validation");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  const validationLabels: VehicleFormValidationLabels = useMemo(
    () => ({
      makeRequired: tv("makeRequired"),
      modelRequired: tv("modelRequired"),
      yearWholeNumber: tv("yearWholeNumber"),
      yearMin: tv("yearMin"),
      yearMax: tv("yearMax"),
      colorRequired: tv("colorRequired"),
      licensePlateRequired: tv("licensePlateRequired"),
      transmissionRequired: tv("transmissionRequired"),
      fuelTypeRequired: tv("fuelTypeRequired"),
      seatsMin: tv("seatsMin"),
      seatsMax: tv("seatsMax"),
      priceMin: tv("priceMin"),
      cityRequired: tv("cityRequired"),
      categoryRequired: tv("categoryRequired"),
    }),
    [tv]
  );

  const schema = useMemo(() => buildSchema(validationLabels), [validationLabels]);

  const isAdmin = session?.user.roles.includes("Admin") ?? false;

  const [categories, setCategories] = useState<readonly Category[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await getCategories();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
        c => c.name.toLowerCase() === vehicle.status.toLowerCase() || c.id === vehicle.status
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

  const galleryEditorLabels: GalleryEditorLabels = useMemo(
    () => ({
      alt: t("gallery.alt"),
      noImageSelected: t("gallery.noImageSelected"),
      featuredImage: t("gallery.featuredImage"),
      setAsFeatured: t("gallery.setAsFeatured"),
      noPreview: t("gallery.noPreview"),
      add: t("gallery.add"),
      fileSizeError: t("gallery.fileSizeError"),
    }),
    [t]
  );

  const vehicleInfoEditorLabels: VehicleInfoEditorLabels = useMemo(
    () => ({
      sections: {
        vehicleIdentity: t("editor.vehicleIdentity"),
        aboutVehicle: t("editor.aboutVehicle"),
        specifications: t("editor.specifications"),
        includedFeatures: t("editor.includedFeatures"),
        carSettings: t("editor.carSettings"),
      },
      fields: {
        make: t("editor.make"),
        model: t("editor.model"),
        year: t("editor.year"),
        color: t("editor.color"),
        licensePlate: t("editor.licensePlate"),
        description: t("editor.description"),
        transmission: t("editor.transmission"),
        fuelType: t("editor.fuelType"),
        seats: t("editor.seats"),
        pricePerDay: t("editor.pricePerDay"),
        locationCity: t("editor.locationCity"),
        category: t("editor.category"),
        availabilityStatus: t("editor.availabilityStatus"),
        approvalStatus: t("editor.approvalStatus"),
        featureName: t("editor.featureName"),
        featureDescription: t("editor.featureDescription"),
      },
      dropdowns: {
        automatic: t("editor.automatic"),
        manual: t("editor.manual"),
        gasoline: t("editor.gasoline"),
        diesel: t("editor.diesel"),
        electric: t("editor.electric"),
        hybrid: t("editor.hybrid"),
        pluginHybrid: t("editor.pluginHybrid"),
        available: t("editor.available"),
        unavailable: t("editor.unavailable"),
        pendingReview: t("editor.pendingReview"),
        approvedActive: t("editor.approvedActive"),
        rejected: t("editor.rejected"),
      },
      features: {
        addFeature: t("editor.addFeature"),
      },
    }),
    [t]
  );

  async function handleCreateMode(values: FormValues, accessToken: string): Promise<void> {
    const payload: CarPayload = {
      userId: session?.user.id ?? "",
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
      categoryId: values.categoryId,
      status: values.status || "Sedan",
      availabilityStatus: values.availabilityStatus || "Available",
    };

    const resText = await createCar(accessToken, payload);

    const vehicleIdRegex = /[0-9a-fA-F-]{36}/;
    const vehicleIdMatch = vehicleIdRegex.exec(resText);
    const vehicleId = vehicleIdMatch ? vehicleIdMatch[0] : null;

    if (!vehicleId) {
      throw new Error(t("alerts.createVehicleIdError"));
    }

    if (values.images.length > 0) {
      for (const img of values.images) {
        if (img.file) {
          try {
            await uploadCarImage(accessToken, vehicleId, img.file);
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
  }

  async function handleUpdateMode(values: FormValues, accessToken: string): Promise<void> {
    const updatedImages = await Promise.all(
      values.images.map(async img => {
        if (img.file) {
          try {
            const res = await uploadVehicleImage(accessToken, vehicle.vehicleId, img.file, isAdmin);
            if (img.url.startsWith("blob:")) {
              URL.revokeObjectURL(img.url);
            }
            return { url: res.url, isPrimary: img.isPrimary };
          } catch (uploadErr) {
            logger.error("Failed to upload image during update", uploadErr);
            throw new Error(t("alerts.uploadImageError"), { cause: uploadErr });
          }
        }
        return { url: img.url, isPrimary: img.isPrimary };
      })
    );

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
      await updateVehicle(accessToken, vehicle.vehicleId, finalValues);
    } else {
      await updateSupplierVehicle(accessToken, vehicle.vehicleId, finalValues);
    }

    methods.reset(finalValues);
    setSuccessToastOpen(true);
  }

  const onSubmit = async (values: FormValues) => {
    if (!session?.accessToken) return;
    setSubmitting(true);
    setSaveError(null);

    try {
      if (onSave) {
        await onSave(values);
        if (!isCreateMode) {
          methods.reset(values);
        }
        setSuccessToastOpen(true);
      } else if (isCreateMode) {
        await handleCreateMode(values, session.accessToken);
      } else {
        await handleUpdateMode(values, session.accessToken);
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
          msg = `${t("errors.validationFailed")}: ${validationErrors}`;
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
      setSaveError(t("errors.generic"));
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
                    <GalleryEditor labels={galleryEditorLabels} />
                  ) : (
                    <Gallery images={vehicle.images} vehicleLabel={`${vehicle.make} ${vehicle.model}`} />
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}
                >
                  {canEdit ? (
                    <VehicleInfoEditor isAdmin={isAdmin} categories={categories} labels={vehicleInfoEditorLabels} />
                  ) : (
                    <VehicleInfo vehicle={vehicle} />
                  )}
                </Paper>

                {!isCreateMode && !hideReviews && (
                  <Paper
                    elevation={0}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: { xs: 2, md: 3 } }}
                  >
                    <ReviewSection reviews={reviews} />
                  </Paper>
                )}
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
                {t("undoBtn")}
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
                {isCreateMode ? t("createVehicleBtn") : t("saveAllBtn")}
              </Fab>

              <Fab
                variant="extended"
                color="secondary"
                onClick={redo}
                disabled={!canRedo || submitting}
                sx={{ px: 3, fontWeight: 700, boxShadow: theme.shadows[10] }}
              >
                {t("redoBtn")}
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
          {isCreateMode ? t("alerts.createSuccess") : t("alerts.updateSuccess")}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}
