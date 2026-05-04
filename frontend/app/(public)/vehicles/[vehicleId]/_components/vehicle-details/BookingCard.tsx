"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";
import type { BookingLocationOption, VehicleDetailsViewModel } from "./types";

interface BookingCardProps {
  readonly vehicle?: VehicleDetailsViewModel;
  readonly locationOptions?: readonly BookingLocationOption[];
  readonly vehicleId?: string;
  readonly basePrice?: number;
}

interface PricingApiResponse {
  readonly totalPrice?: number;
}

interface BookingApiSuccess {
  readonly bookingId?: string;
  readonly bookingNumber?: string;
}

interface ValidationError {
  readonly field?: string;
  readonly message?: string;
}

interface BookingApiError {
  readonly message?: string;
  readonly validationErrors?: readonly ValidationError[];
}

interface FormErrors {
  pickupLocationId?: string;
  dropoffLocationId?: string;
  pickupDate?: string;
  returnDate?: string;
}

function formatDateForApi(value: Date): string {
  return value.toISOString();
}

function getFallbackVehicle(vehicleId?: string, basePrice?: number): VehicleDetailsViewModel {
  return {
    vehicleId: vehicleId ?? "",
    make: "",
    model: "",
    year: 0,
    color: "",
    transmission: "",
    fuelType: "",
    seats: 0,
    pricePerDay: basePrice ?? 0,
    locationCity: "",
    description: "",
    status: "",
    availabilityStatus: "",
    images: [],
    features: [],
    supplierName: "",
    averageRating: 0,
    reviewCount: 0,
  };
}

export default function BookingCard({ vehicle, locationOptions, vehicleId, basePrice }: BookingCardProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const resolvedVehicle: VehicleDetailsViewModel = useMemo(
    () => vehicle ?? getFallbackVehicle(vehicleId, basePrice),
    [vehicle, vehicleId, basePrice]
  );

  const resolvedLocations = useMemo(() => locationOptions ?? [], [locationOptions]);

  const defaultLocationId = useMemo(() => {
    const cityMatch = resolvedLocations.find(
      option => option.city.toLowerCase() === resolvedVehicle.locationCity.toLowerCase()
    );
    if (cityMatch) return cityMatch.id;
    return resolvedLocations[0] ? resolvedLocations[0].id : "";
  }, [resolvedLocations, resolvedVehicle.locationCity]);

  const [pickupLocationId, setPickupLocationId] = useState(defaultLocationId);
  const [dropoffLocationId, setDropoffLocationId] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [totalPrice, setTotalPrice] = useState(resolvedVehicle.pricePerDay);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const validate = useCallback((): FormErrors => {
    const nextErrors: FormErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupLocationId === "") {
      nextErrors.pickupLocationId = "Pickup location is required.";
    }
    if (dropoffLocationId === "") {
      nextErrors.dropoffLocationId = "Drop-off location is required.";
    }
    if (!pickupDate) {
      nextErrors.pickupDate = "Pickup date is required.";
    } else if (pickupDate < today) {
      nextErrors.pickupDate = "Pickup date must be today or later.";
    }
    if (!returnDate) {
      nextErrors.returnDate = "Return date is required.";
    } else if (pickupDate && returnDate <= pickupDate) {
      nextErrors.returnDate = "Return date must be after pickup date.";
    }

    return nextErrors;
  }, [pickupLocationId, dropoffLocationId, pickupDate, returnDate]);

  useEffect(() => {
    const validationErrors = validate();
    if (validationErrors.pickupDate || validationErrors.returnDate || !pickupDate || !returnDate) {
      return;
    }

    const controller = new AbortController();
    const loadPricing = async () => {
      setIsPricingLoading(true);
      try {
        const url = toApiUrl(
          `/api/vehicles/${resolvedVehicle.vehicleId}/pricing?pickupDate=${encodeURIComponent(
            formatDateForApi(pickupDate)
          )}&returnDate=${encodeURIComponent(formatDateForApi(returnDate))}`
        );
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;

        const payload = (await response.json()) as PricingApiResponse;
        setTotalPrice(payload.totalPrice ?? resolvedVehicle.pricePerDay);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        logger.error("Booking pricing request failed", error);
      } finally {
        setIsPricingLoading(false);
      }
    };

    void loadPricing();
    return () => {
      controller.abort();
    };
  }, [pickupDate, returnDate, resolvedVehicle.pricePerDay, resolvedVehicle.vehicleId, validate]);

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!session?.accessToken) {
      setSubmitError("Please sign in to complete booking.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(toApiUrl("/api/bookings/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          vehicleId: resolvedVehicle.vehicleId,
          pickupLocationId,
          dropOffLocationId: dropoffLocationId,
          pickupDate: pickupDate ? formatDateForApi(pickupDate) : "",
          returnDate: returnDate ? formatDateForApi(returnDate) : "",
          driverId: null,
          payLater: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as BookingApiError | null;
        setSubmitError(payload?.validationErrors?.[0]?.message ?? payload?.message ?? "Booking request failed.");
        return;
      }

      const payload = (await response.json()) as BookingApiSuccess;
      if (payload.bookingId) {
        router.push(`/booking/checkout/${payload.bookingId}`);
      } else {
        setSubmitSuccess(payload.bookingNumber ? `Booking created: ${payload.bookingNumber}` : "Booking created.");
      }
    } catch (error) {
      logger.error("Booking submit failed", error);
      setSubmitError("Unable to create booking right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const days =
    pickupDate && returnDate
      ? Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Reserve this vehicle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(resolvedVehicle.pricePerDay)} / day
          </Typography>
        </Stack>

        {resolvedLocations.length > 0 ? (
          <Stack spacing={2}>
            <FormControl fullWidth error={Boolean(errors.pickupLocationId)}>
              <InputLabel id="pickup-location-label">Pickup location</InputLabel>
              <Select
                labelId="pickup-location-label"
                value={pickupLocationId}
                label="Pickup location"
                onChange={event => {
                  setPickupLocationId(event.target.value);
                }}
              >
                {resolvedLocations.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.pickupLocationId && (
              <Typography variant="caption" color="error.main">
                {errors.pickupLocationId}
              </Typography>
            )}

            <FormControl fullWidth error={Boolean(errors.dropoffLocationId)}>
              <InputLabel id="dropoff-location-label">Drop-off location</InputLabel>
              <Select
                labelId="dropoff-location-label"
                value={dropoffLocationId}
                label="Drop-off location"
                onChange={event => {
                  setDropoffLocationId(event.target.value);
                }}
              >
                {resolvedLocations.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.dropoffLocationId && (
              <Typography variant="caption" color="error.main">
                {errors.dropoffLocationId}
              </Typography>
            )}
          </Stack>
        ) : (
          <Alert severity="warning">No pickup locations are available at the moment.</Alert>
        )}

        <DatePicker
          label="Pickup date"
          value={pickupDate}
          onChange={value => {
            setPickupDate(value);
          }}
          minDate={new Date()}
        />
        {errors.pickupDate && (
          <Typography variant="caption" color="error.main">
            {errors.pickupDate}
          </Typography>
        )}

        <DatePicker
          label="Return date"
          value={returnDate}
          onChange={value => {
            setReturnDate(value);
          }}
          minDate={pickupDate ?? new Date()}
        />
        {errors.returnDate && (
          <Typography variant="caption" color="error.main">
            {errors.returnDate}
          </Typography>
        )}

        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, bgcolor: "background.default" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Estimated total ({days} {days === 1 ? "day" : "days"})
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {isPricingLoading ? "Updating..." : formatCurrency(totalPrice)}
            </Typography>
          </Stack>
        </Box>

        {submitError && <Alert severity="error">{submitError}</Alert>}
        {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}

        <Button
          variant="contained"
          size="large"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting || resolvedLocations.length === 0 || resolvedVehicle.vehicleId === ""}
        >
          {isSubmitting ? "Creating booking..." : "Reserve now"}
        </Button>

        {!session?.accessToken && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            You need to{" "}
            <Box component={Link} href="/login" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 700 }}>
              sign in
            </Box>{" "}
            before placing a booking.
          </Typography>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
