"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Divider,
  InputAdornment,
  useTheme,
  alpha,
  Radio,
} from "@mui/material";
import {
  ArrowBackRounded as BackIcon,
  SaveOutlined as SaveIcon,
  SearchRounded as SearchIcon,
  PersonOutlineRounded as PersonIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  PlaceOutlined as PlaceIcon,
  CheckCircleRounded as CheckIcon,
} from "@mui/icons-material";
import { darken } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useRouter } from "@/shared/i18n/routing";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  searchCustomersPicker,
  searchAvailableVehiclesPicker,
  createBooking,
  type CustomerPickerItem,
  type VehiclePickerItem,
} from "@/api-clients/bookings/bookings";
import { toApiUrl } from "@/utils/api-client";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";

const formatCurrency = (n?: number | null) => {
  if (n == null || isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
};

interface SectionCardProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly step: number;
  readonly done?: boolean;
  readonly children: React.ReactNode;
}

interface LocationSuggestionApi {
  readonly locationId?: string;
  readonly displayText?: string;
}

interface LocationOption {
  readonly id: string;
  readonly label: string;
}

function SectionCard({ title, subtitle, step, done, children }: SectionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: done ? "success.main" : "divider",
        bgcolor: theme => (done ? alpha(theme.palette.success.main, 0.02) : "background.paper"),
        transition: "border-color 0.2s",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme => (done ? theme.palette.success.main : alpha(theme.palette.primary.main, 0.1)),
            color: done ? "common.white" : "primary.main",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {done ? <CheckIcon fontSize="small" /> : step}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

export default function CreateBookingClient() {
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();
  const t = useTranslations("dashboardAdmin.createBooking");
  const tCommon = useTranslations("common");

  // ── Form state ─────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<CustomerPickerItem | null>(null);
  const [vehicle, setVehicle] = useState<VehiclePickerItem | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Online">("Cash");

  // ── Picker state ───────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerPickerItem[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState<VehiclePickerItem[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [pickupLocationOptions, setPickupLocationOptions] = useState<LocationOption[]>([]);
  const [pickupLocationLoading, setPickupLocationLoading] = useState(false);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<LocationOption | null>(null);
  const [dropOffLocationOptions, setDropOffLocationOptions] = useState<LocationOption[]>([]);
  const [dropOffLocationLoading, setDropOffLocationLoading] = useState(false);
  const [selectedDropOffLocation, setSelectedDropOffLocation] = useState<LocationOption | null>(null);

  // ── Submit state ──────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Async customer search (debounced) ─────────────────────────────
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;
    const trimmedQuery = customerSearch.trim();
    const controller = new AbortController();

    const runSearch = async () => {
      setCustomerLoading(true);
      try {
        const data = await searchCustomersPicker(token, trimmedQuery, 20, controller.signal);
        setCustomerOptions(data);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          logger.error("Customer picker search failed", e);
        }
      } finally {
        setCustomerLoading(false);
      }
    };

    const handle = setTimeout(() => {
      void runSearch();
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [customerSearch, session?.accessToken]);

  // ── Async vehicle search (debounced; re-runs on date change) ──────
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    if (!selectedPickupLocation) {
      setVehicleOptions([]);
      return;
    }

    const controller = new AbortController();

    const runSearch = async () => {
      setVehicleLoading(true);
      try {
        const data = await searchAvailableVehiclesPicker(
          token,
          {
            search: vehicleSearch,
            pickupDate: pickupDate ? pickupDate.toISOString() : undefined,
            returnDate: returnDate ? returnDate.toISOString() : undefined,
            customerUserId: customer?.id,
            pickupLocationId: selectedPickupLocation.id,
            limit: 20,
          },
          controller.signal
        );
        setVehicleOptions(data);
        // If the selected vehicle disappeared from the results, clear it.
        if (vehicle && !data.find(v => v.id === vehicle.id)) {
          setVehicle(null);
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          logger.error("Vehicle picker search failed", e);
        }
      } finally {
        setVehicleLoading(false);
      }
    };

    const handle = setTimeout(() => {
      void runSearch();
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [vehicleSearch, pickupDate, returnDate, session?.accessToken, vehicle, customer?.id, selectedPickupLocation]);

  // ── Location autocomplete (pickup/dropoff) ─────────────────────────
  const fetchLocationSuggestions = async (query: string, type: "pickup" | "dropoff", signal: AbortSignal) => {
    if (query.length < 3) {
      const searchParam = query ? `?s=${encodeURIComponent(query)}` : "";
      const response = await fetch(toApiUrl(`/api/locations/1/10/en${searchParam}`), { signal, cache: "no-store" });
      if (!response.ok) throw new Error(`Locations failed with ${String(response.status)}`);
      const payload = (await response.json()) as { resultData?: { _id: string; name: string }[] };
      return (payload.resultData ?? []).map(item => ({ id: item._id, label: item.name }));
    }

    const response = await fetch(
      toApiUrl(`/api/locations/autocomplete?query=${encodeURIComponent(query)}&type=${type}&limit=10`),
      { signal, cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Autocomplete failed with ${String(response.status)}`);
    }

    const payload = (await response.json()) as { suggestions?: readonly LocationSuggestionApi[] };
    return (payload.suggestions ?? [])
      .map(suggestion => {
        const id = suggestion.locationId ?? "";
        const label = suggestion.displayText ?? "";
        return id !== "" && label !== "" ? { id, label } : null;
      })
      .filter((item): item is LocationOption => item !== null);
  };

  useEffect(() => {
    const trimmedQuery = pickupLocation.trim();

    let active = true;
    const controller = new AbortController();
    setPickupLocationLoading(true);
    const handle = setTimeout(() => {
      void fetchLocationSuggestions(trimmedQuery, "pickup", controller.signal)
        .then(options => {
          if (active) setPickupLocationOptions(options);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            logger.error("Pickup location autocomplete error", error);
          }
          if (active) setPickupLocationOptions([]);
        })
        .finally(() => {
          if (active) setPickupLocationLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(handle);
      controller.abort();
    };
  }, [pickupLocation]);

  useEffect(() => {
    const trimmedQuery = dropOffLocation.trim();

    let active = true;
    const controller = new AbortController();
    setDropOffLocationLoading(true);
    const handle = setTimeout(() => {
      void fetchLocationSuggestions(trimmedQuery, "dropoff", controller.signal)
        .then(options => {
          if (active) setDropOffLocationOptions(options);
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            logger.error("Dropoff location autocomplete error", error);
          }
          if (active) setDropOffLocationOptions([]);
        })
        .finally(() => {
          if (active) setDropOffLocationLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(handle);
      controller.abort();
    };
  }, [dropOffLocation]);

  // ── Derived pricing ───────────────────────────────────────────────
  const dailyRate = vehicle?.dailyRate ?? 0;
  const { totalDays, totalPrice, datesValid } = useMemo(() => {
    const p = pickupDate;
    const r = returnDate;
    if (!p || !r || isNaN(p.getTime()) || isNaN(r.getTime()) || p >= r) {
      return { totalDays: 0, totalPrice: 0, datesValid: false };
    }
    const days = Math.round((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
    return { totalDays: days, totalPrice: days * dailyRate, datesValid: true };
  }, [pickupDate, returnDate, dailyRate]);

  // ── Validity checks for each section ──────────────────────────────
  const customerDone = !!customer;
  const vehicleDone = !!vehicle;
  const datesDone = datesValid && !!pickupLocation && !!dropOffLocation;
  const canSubmit = customerDone && vehicleDone && datesDone && !submitting;
  const showDateError = !!pickupDate && !!returnDate && !datesValid;

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = () => {
    void (async () => {
      if (!session?.accessToken || !customer || !vehicle || !datesValid || submitting || !pickupDate || !returnDate)
        return;
      setSubmitting(true);
      setError(null);
      try {
        const result = await createBooking(session.accessToken, {
          vehicleId: vehicle.id,
          pickupDate: pickupDate.toISOString(),
          returnDate: returnDate.toISOString(),
          pickupLocation,
          dropOffLocation,
          pickupLocationId: selectedPickupLocation?.id,
          dropOffLocationId: selectedDropOffLocation?.id,
          customerUserId: customer.id,
          paymentMethod,
        });
        if (paymentMethod === "Online") {
          router.push(`/booking/payment/${result.bookingId}`);
        } else {
          const bookingNumber = encodeURIComponent(result.bookingNumber);
          router.push(`/admin/bookings?created=1&bookingNumber=${bookingNumber}`);
        }
      } catch (e) {
        if (e instanceof Error && e.name === "ApiError") {
          logger.warn(`Failed to create booking: ${e.message}`);
          setError(e.message);
        } else {
          logger.error("Failed to create booking", e);
          setError(e instanceof Error ? e.message : "Failed to create booking.");
        }
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── HEADER ── */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, mb: 4 }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <IconButton
            onClick={() => {
              router.push("/admin/bookings");
            }}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("subtitle")}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => {
              router.push("/admin/bookings");
            }}
            sx={{ borderRadius: 2 }}
            disabled={submitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? undefined : <SaveIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit}
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 180 }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : t("buttons.create")}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        }}
      >
        {/* ── LEFT — sections stack ── */}
        <Stack spacing={3}>
          {/* 1. Customer Selection */}
          <SectionCard
            step={1}
            title={t("steps.customer.title")}
            subtitle={t("steps.customer.subtitle")}
            done={customerDone}
          >
            <Autocomplete
              options={customerOptions}
              value={customer}
              inputValue={customerSearch}
              onInputChange={(_, value) => {
                setCustomerSearch(value);
              }}
              onChange={(_, value) => {
                setCustomer(value);
                if (value) {
                  setCustomerSearch(value.fullName || value.email || value.phone || "");
                } else {
                  setCustomerSearch("");
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={option => option.fullName || option.email || option.phone || t("steps.customer.unnamed")}
              loading={customerLoading}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                  },
                },
              }}
              noOptionsText={
                customerSearch.trim().length < 3 ? t("steps.customer.minCharacters") : t("steps.customer.noOptions")
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {option.fullName || t("steps.customer.unnamed")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {option.email ?? t("steps.customer.noEmail")} · {option.phone ?? t("steps.customer.noPhone")}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t("steps.customer.label")}
                  placeholder={t("steps.customer.placeholder")}
                  fullWidth
                  size="small"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "text.disabled" }} />
                          </InputAdornment>
                          {params.slotProps.input.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {customerLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </SectionCard>

          {/* 2. Booking Information */}
          <SectionCard step={2} title={t("steps.info.title")} subtitle={t("steps.info.subtitle")} done={datesDone}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t("steps.info.pickupDate")}
                  value={pickupDate}
                  onChange={value => {
                    setPickupDate(value);
                  }}
                  disablePast
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label={t("steps.info.returnDate")}
                  value={returnDate}
                  onChange={value => {
                    setReturnDate(value);
                  }}
                  minDate={pickupDate ?? new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: showDateError,
                      helperText: showDateError ? t("steps.info.returnDateError") : "",
                    },
                  }}
                />
              </LocalizationProvider>
              <Autocomplete
                options={pickupLocationOptions}
                loading={pickupLocationLoading}
                inputValue={pickupLocation}
                value={selectedPickupLocation}
                filterOptions={x => x}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                    },
                  },
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") {
                    setPickupLocation(value);
                    setSelectedPickupLocation(null);
                  }
                  if (reason === "clear") {
                    setPickupLocation("");
                    setSelectedPickupLocation(null);
                  }
                }}
                onChange={(_, value) => {
                  setSelectedPickupLocation(value);
                  setPickupLocation(value?.label ?? "");
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={option => option.label}
                noOptionsText={t("steps.info.noLocations")}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <PlaceIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      <Typography variant="body2">{option.label}</Typography>
                    </Stack>
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t("steps.info.pickupLocation")}
                    placeholder={t("steps.info.pickupLocationPlaceholder")}
                    fullWidth
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PlaceIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                            {params.slotProps.input.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {pickupLocationLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            {params.slotProps.input.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
              <Autocomplete
                options={dropOffLocationOptions}
                loading={dropOffLocationLoading}
                inputValue={dropOffLocation}
                value={selectedDropOffLocation}
                filterOptions={x => x}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                    },
                  },
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") {
                    setDropOffLocation(value);
                    setSelectedDropOffLocation(null);
                  }
                  if (reason === "clear") {
                    setDropOffLocation("");
                    setSelectedDropOffLocation(null);
                  }
                }}
                onChange={(_, value) => {
                  setSelectedDropOffLocation(value);
                  setDropOffLocation(value?.label ?? "");
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={option => option.label}
                noOptionsText={t("steps.info.noLocations")}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <PlaceIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      <Typography variant="body2">{option.label}</Typography>
                    </Stack>
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t("steps.info.dropoffLocation")}
                    placeholder={t("steps.info.dropoffLocationPlaceholder")}
                    fullWidth
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PlaceIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                            {params.slotProps.input.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {dropOffLocationLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            {params.slotProps.input.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Box>
          </SectionCard>

          {/* 3. Vehicle Selection */}
          <SectionCard
            step={3}
            title={t("steps.vehicle.title")}
            subtitle={selectedPickupLocation ? t("steps.vehicle.subtitleActive") : t("steps.vehicle.subtitleInactive")}
            done={vehicleDone}
          >
            {!vehicle ? (
              <Autocomplete
                disabled={!selectedPickupLocation}
                options={vehicleOptions}
                value={vehicle}
                inputValue={vehicleSearch}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") setVehicleSearch(value);
                  if (reason === "clear") {
                    setVehicleSearch("");
                    setVehicle(null);
                  }
                }}
                onChange={(_, value) => {
                  setVehicle(value);
                }}
                loading={vehicleLoading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={option => option.name}
                filterOptions={x => x}
                noOptionsText={
                  !selectedPickupLocation ? t("steps.vehicle.noLocationSelected") : t("steps.vehicle.noVehiclesFound")
                }
                slotProps={{
                  paper: {
                    sx: { bgcolor: theme => darken(theme.palette.background.paper, 0.04) },
                  },
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%", py: 0.5 }}>
                      <Avatar
                        variant="rounded"
                        src={toImageUrl(option.thumbnail ?? undefined)}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: "primary.main",
                        }}
                      >
                        <CarIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>
                          {option.name || t("steps.vehicle.unnamed")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {option.plateNumber ?? t("steps.vehicle.noPlate")} · {option.supplierName ?? "—"}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "success.main", whiteSpace: "nowrap" }}>
                        {t("steps.vehicle.dailyRate", { rate: formatCurrency(option.dailyRate ?? 0) })}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t("steps.vehicle.label")}
                    placeholder={t("steps.vehicle.placeholder")}
                    fullWidth
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                            {params.slotProps.input.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {vehicleLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            {params.slotProps.input.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "success.main",
                  bgcolor: theme => alpha(theme.palette.success.main, 0.04),
                }}
              >
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar
                      variant="rounded"
                      src={toImageUrl(vehicle.thumbnail ?? undefined)}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: "primary.main",
                      }}
                    >
                      <CarIcon />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{vehicle.name || "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.plateNumber ?? t("steps.vehicle.noPlate")} · {vehicle.supplierName ?? "—"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Chip
                      label={t("steps.vehicle.dailyRate", { rate: formatCurrency(vehicle.dailyRate ?? 0) })}
                      size="small"
                      color="success"
                      sx={{ fontWeight: 700 }}
                    />
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setVehicle(null);
                      }}
                    >
                      {t("steps.vehicle.change")}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </SectionCard>

          {/* 4. Payment Method Selection */}
          <SectionCard step={4} title={t("steps.payment.title")} subtitle={t("steps.payment.subtitle")} done={true}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <Paper
                elevation={0}
                onClick={() => {
                  setPaymentMethod("Cash");
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: theme => (paymentMethod === "Cash" ? theme.palette.primary.main : theme.palette.divider),
                  bgcolor: theme =>
                    paymentMethod === "Cash" ? alpha(theme.palette.primary.main, 0.04) : "background.paper",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: theme => theme.palette.primary.main,
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Radio
                    checked={paymentMethod === "Cash"}
                    value="Cash"
                    onChange={() => {
                      setPaymentMethod("Cash");
                    }}
                    sx={{
                      color: theme => theme.palette.divider,
                      "&.Mui-checked": {
                        color: theme => theme.palette.primary.main,
                      },
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{t("steps.payment.cash.title")}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("steps.payment.cash.description")}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                onClick={() => {
                  setPaymentMethod("Online");
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: theme =>
                    paymentMethod === "Online" ? theme.palette.primary.main : theme.palette.divider,
                  bgcolor: theme =>
                    paymentMethod === "Online" ? alpha(theme.palette.primary.main, 0.04) : "background.paper",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: theme => theme.palette.primary.main,
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.02),
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Radio
                    checked={paymentMethod === "Online"}
                    value="Online"
                    onChange={() => {
                      setPaymentMethod("Online");
                    }}
                    sx={{
                      color: theme => theme.palette.divider,
                      "&.Mui-checked": {
                        color: theme => theme.palette.primary.main,
                      },
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{t("steps.payment.online.title")}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("steps.payment.online.description")}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </SectionCard>
        </Stack>

        {/* ── RIGHT — Pricing Summary ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            height: "fit-content",
            position: { lg: "sticky" },
            top: { lg: 24 },
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 2 }}>{t("summary.title")}</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {t("summary.dailyRate")}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatCurrency(dailyRate)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {t("summary.totalDays")}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {datesValid ? t("summary.totalDaysPlural", { count: totalDays }) : "—"}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t("summary.totalPrice")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>
                {formatCurrency(totalPrice)}
              </Typography>
            </Stack>
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t("summary.noticeLive")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("summary.noticeConfirm")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("summary.noticeFlow")}
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
