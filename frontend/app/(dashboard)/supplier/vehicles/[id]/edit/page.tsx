"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  getSupplierVehicleById,
  isRejectedStatus,
  updateSupplierVehicle,
  uploadVehicleImage,
  type SupplierVehicleDetails,
  type UpdateSupplierVehiclePayload,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { logger } from "@/utils/logger";
import VehicleForm from "../../_components/VehicleForm";
import { DEFAULT_VEHICLE_FORM, type VehicleFormValues } from "../../_components/VehicleForm.schema";

export default function EditSupplierVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [vehicle, setVehicle] = useState<SupplierVehicleDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedToastOpen, setSavedToastOpen] = useState(false);

  // ── Load existing vehicle ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (sessionStatus === "loading") return;
      if (!id) return;

      if (!session?.accessToken) {
        setLoading(false);
        setLoadError("You must be signed in to edit this vehicle.");
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const data = await getSupplierVehicleById(session.accessToken, id);
        if (cancelled) return;
        setVehicle(data);
      } catch (err: unknown) {
        if (cancelled) return;
        logger.error("Failed to load vehicle for edit", err);
        setVehicle(null);
        setLoadError(
          err instanceof Error && err.message.toLowerCase().includes("not found")
            ? "Vehicle not found, or you don't have permission to edit it."
            : "Could not load this vehicle. Please try again shortly."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, session?.accessToken, sessionStatus]);

  // Map the server DTO to the form's field shape, with the same defaults
  // the form would apply for missing values.
  const initialValues: VehicleFormValues | undefined = useMemo(() => {
    if (!vehicle) return undefined;
    return {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? DEFAULT_VEHICLE_FORM.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      transmission:
        vehicle.transmission === "Manual" || vehicle.transmission === "Automatic" ? vehicle.transmission : "Automatic",
      fuelType: vehicle.fuelType || "Gasoline",
      seats: vehicle.seats ?? DEFAULT_VEHICLE_FORM.seats,
      pricePerDay: vehicle.pricePerDay,
      locationCity: vehicle.locationCity,
      description: vehicle.description,
      imageUrl: vehicle.imageUrl,
    };
  }, [vehicle]);

  const readOnly = vehicle ? vehicle.isReadOnly || isRejectedStatus(vehicle.status) : false;

  const handleSubmit = (values: VehicleFormValues, imageFile: File | null) => {
    void (async () => {
      if (!session?.accessToken || !vehicle) return;
      setSubmitting(true);
      setApiError(null);
      try {
        let imageUrl = values.imageUrl;

        // 1. If a new file was selected, upload it first
        if (imageFile) {
          const uploadRes = await uploadVehicleImage(session.accessToken, vehicle.vehicleId, imageFile);
          imageUrl = uploadRes.url;
        }

        const payload: UpdateSupplierVehiclePayload = {
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
          description: values.description?.trim() ? values.description : undefined,
          imageUrl: imageUrl?.trim() ? imageUrl : undefined,
        };
        await updateSupplierVehicle(session.accessToken, vehicle.vehicleId, payload);

        setSavedToastOpen(true);
        // Brief pause so the toast registers, then return to the list.
        window.setTimeout(() => {
          router.push("/supplier/vehicles");
        }, 800);
      } catch (err) {
        logger.error("Failed to update supplier vehicle", err);
        setApiError(err instanceof Error ? err.message : "Failed to update vehicle.");
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <Tooltip title="Back to vehicles">
          <IconButton
            onClick={() => {
              router.push("/supplier/vehicles");
            }}
            sx={{ borderRadius: 2 }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Edit vehicle
          </Typography>
          <Typography color="text.secondary">
            Changes apply immediately. Approval status is managed by an admin.
          </Typography>
        </Box>
      </Stack>

      {(() => {
        if (loading) {
          return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          );
        }

        if (loadError) {
          return (
            <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
              {loadError}
            </Alert>
          );
        }

        if (vehicle && initialValues) {
          return (
            <>
              {readOnly && (
                <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                  This vehicle was rejected by an admin and is read-only. You can view its details but not save changes.
                </Alert>
              )}
              <VehicleForm
                initialValues={initialValues}
                submitLabel="Save changes"
                submitting={submitting}
                apiError={apiError}
                readOnly={readOnly}
                onSubmit={handleSubmit}
                onCancel={() => {
                  router.push("/supplier/vehicles");
                }}
              />
            </>
          );
        }

        return null;
      })()}

      <Snackbar
        open={savedToastOpen}
        autoHideDuration={2500}
        onClose={() => {
          setSavedToastOpen(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => {
            setSavedToastOpen(false);
          }}
          sx={{ borderRadius: 2 }}
        >
          Changes saved.
        </Alert>
      </Snackbar>
    </Box>
  );
}
