"use client";

import { useRouter } from "@/shared/i18n/routing";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toApiUrl } from "@/utils/api-client";
import { formatCurrency } from "@/utils/currency-helpers";
import { logger } from "@/utils/logger";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
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
    licensePlate: "",
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
    supplierId: "",
    supplierName: "",
    averageRating: 0,
    reviewCount: 0,
  };
}

export default function BookingCard({ vehicle, locationOptions, vehicleId, basePrice }: BookingCardProps) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Identity-verification gate. Approved users see the booking form as
  // usual; everyone else (NotSubmitted / Pending / Rejected) sees the
  // warning card that routes to Profile → Verification. Guests are
  // unaffected — they hit the auth gate at checkout already.
  const verification = useVerificationStatus();
  const isAuthLoading = authStatus === "loading";
  const isSignedIn = authStatus === "authenticated";

  const isGlobalLoading = isAuthLoading || (isSignedIn && verification.loading);

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
  const [pickupDate, setPickupDate] = useState<Date | null>(() => {
    const now = new Date();
    const hoursRemaining = 24 - now.getHours();
    const date = hoursRemaining < 12 ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [totalPrice, setTotalPrice] = useState(resolvedVehicle.pricePerDay);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const handleSubmit = () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const intent = {
      vehicleId: resolvedVehicle.vehicleId,
      pickupLocationId,
      dropOffLocationId: dropoffLocationId,
      pickupDate: pickupDate ? formatDateForApi(pickupDate) : "",
      returnDate: returnDate ? formatDateForApi(returnDate) : "",
      totalPrice,
      vehicleLabel: `${resolvedVehicle.make} ${resolvedVehicle.model}`,
      pricePerDay: resolvedVehicle.pricePerDay,
    };
    sessionStorage.setItem("bookingIntent", JSON.stringify(intent));
    router.push(`/booking/driver-selection/${resolvedVehicle.vehicleId}`);
  };

  const days =
    pickupDate && returnDate
      ? Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  // Unified loading skeleton for the entire card to prevent flicking
  if (isGlobalLoading) {
    return (
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" height={24} />
        </Stack>
        <Stack spacing={2}>
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="100%" height={64} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: 999 }} />
        </Stack>
      </Stack>
    );
  }

  // If a signed-in customer is not approved, we disable the booking
  // button and show a hint. Guests are unaffected.
  const isBookingDisabled = isSignedIn && !verification.isApproved;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Reserve this vehicle
          </Typography>
          {resolvedVehicle.discountPercentage ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "line-through", fontWeight: 500 }}
              >
                {formatCurrency(resolvedVehicle.originalPricePerDay ?? 0)}
              </Typography>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                {formatCurrency(resolvedVehicle.pricePerDay)} / day
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(resolvedVehicle.pricePerDay)} / day
            </Typography>
          )}
        </Stack>

        {resolvedLocations.length > 0 ? (
          <Stack spacing={2}>
            <FormControl fullWidth error={Boolean(errors.pickupLocationId)} disabled={isBookingDisabled}>
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

            <FormControl fullWidth error={Boolean(errors.dropoffLocationId)} disabled={isBookingDisabled}>
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
          disabled={isBookingDisabled}
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
          disabled={isBookingDisabled}
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

        <Button
          variant="contained"
          size="large"
          onClick={() => {
            handleSubmit();
          }}
          disabled={isBookingDisabled || resolvedLocations.length === 0 || resolvedVehicle.vehicleId === ""}
        >
          {isBookingDisabled ? "Verification Required" : "Reserve now"}
        </Button>

        {isBookingDisabled && (
          <Typography variant="caption" color="warning.main" sx={{ textAlign: "center", fontWeight: 600 }}>
            Please complete verification to enable booking.
          </Typography>
        )}

        {!session?.accessToken && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            You&apos;ll be asked to sign in or create an account at checkout.
          </Typography>
        )}
      </Stack>
    </LocalizationProvider>
  );
}
