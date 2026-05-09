"use client";

import { useState } from "react";
import { Alert, Box, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  createSupplierVehicle,
  type CreateSupplierVehiclePayload,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { logger } from "@/utils/logger";
import VehicleForm, { type VehicleFormValues } from "../_components/VehicleForm";

const PENDING_TOAST_MESSAGE = "Vehicle submitted successfully and is pending review.";

export default function CreateSupplierVehiclePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const handleCancel = () => {
    router.push("/supplier/vehicles");
  };

  const handleSubmit = (values: VehicleFormValues) => {
    void (async () => {
      if (!session?.accessToken) {
        setApiError("You must be signed in to create a vehicle.");
        return;
      }

      setSubmitting(true);
      setApiError(null);
      try {
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
          description: values.description?.trim() ? values.description : undefined,
          imageUrl: values.imageUrl?.trim() ? values.imageUrl : undefined,
        };
        await createSupplierVehicle(session.accessToken, payload);

        // Show toast briefly, then redirect to the list. Using a tiny
        // timeout so the user actually sees the success state before
        // the route changes.
        setToastOpen(true);
        window.setTimeout(() => {
          router.push("/supplier/vehicles");
        }, 800);
      } catch (err) {
        logger.error("Failed to create supplier vehicle", err);
        setApiError(err instanceof Error ? err.message : "Failed to create vehicle.");
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
            Add New Vehicle
          </Typography>
          <Typography color="text.secondary">
            New listings start as <strong>Pending</strong> and become bookable after admin approval.
          </Typography>
        </Box>
      </Stack>

      <VehicleForm
        submitLabel="Submit for review"
        submitting={submitting}
        apiError={apiError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => {
          setToastOpen(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => {
            setToastOpen(false);
          }}
          sx={{ borderRadius: 2 }}
        >
          {PENDING_TOAST_MESSAGE}
        </Alert>
      </Snackbar>
    </Box>
  );
}
