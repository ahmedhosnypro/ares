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
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

  // ── Form state ─────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<CustomerPickerItem | null>(null);
  const [vehicle, setVehicle] = useState<VehiclePickerItem | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropOffLocation, setDropOffLocation] = useState("");

  // ── Picker state ───────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerPickerItem[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleOptions, setVehicleOptions] = useState<VehiclePickerItem[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [pickupLocationOptions, setPickupLocationOptions] = useState<LocationOption[]>([]);
  const [pickupLocationLoading, setPickupLocationLoading] = useState(false);
  const [dropOffLocationOptions, setDropOffLocationOptions] = useState<LocationOption[]>([]);
  const [dropOffLocationLoading, setDropOffLocationLoading] = useState(false);

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
    // vehicle is intentionally NOT a dependency to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleSearch, pickupDate, returnDate, session?.accessToken]);

  // ── Location autocomplete (pickup/dropoff) ─────────────────────────
  const fetchLocationSuggestions = async (query: string, type: "pickup" | "dropoff", signal: AbortSignal) => {
    const response = await fetch(
      toApiUrl(`/api/locations/autocomplete?query=${encodeURIComponent(query)}&type=${type}`),
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
    if (trimmedQuery.length < 3) {
      setPickupLocationOptions([]);
      setPickupLocationLoading(false);
      return;
    }

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
    if (trimmedQuery.length < 3) {
      setDropOffLocationOptions([]);
      setDropOffLocationLoading(false);
      return;
    }

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
  const { totalDays, totalPrice, datesValid, daysString } = useMemo(() => {
    const p = pickupDate;
    const r = returnDate;
    if (!p || !r || isNaN(p.getTime()) || isNaN(r.getTime()) || p >= r) {
      return { totalDays: 0, totalPrice: 0, datesValid: false, daysString: "" };
    }
    const days = Math.round((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
    const daysString = days === 1 ? "" : "s";
    return { totalDays: days, totalPrice: days * dailyRate, datesValid: true, daysString };
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
          customerUserId: customer.id,
        });
        const bookingNumber = encodeURIComponent(result.bookingNumber);
        router.push(`/admin/bookings?created=1&bookingNumber=${bookingNumber}`);
      } catch (e) {
        logger.error("Failed to create booking", e);
        setError(e instanceof Error ? e.message : "Failed to create booking.");
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
              Create Booking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up a new reservation for a customer.
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
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={submitting ? undefined : <SaveIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit}
            sx={{ borderRadius: 2, fontWeight: 700, minWidth: 180 }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : "Create Booking"}
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
            title="Customer"
            subtitle="Search and pick the customer for this booking"
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
              getOptionLabel={option => option.fullName || option.email || option.phone || "Unnamed customer"}
              loading={customerLoading}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                  },
                },
              }}
              noOptionsText={
                customerSearch.trim().length < 3
                  ? "Type at least 3 characters to search customers."
                  : "No customers found."
              }
              renderOption={(props, option) => (
                <li {...props}>
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
                        {option.fullName || "Unnamed"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {option.email ?? "no email"} · {option.phone ?? "no phone"}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              )}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Customer"
                  placeholder="Search by name, email, or phone…"
                  fullWidth
                  size="small"
                  slotProps={{
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
          <SectionCard
            step={2}
            title="Booking Information"
            subtitle="Dates and pickup / dropoff details"
            done={datesDone}
          >
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Pickup Date"
                  value={pickupDate}
                  onChange={value => {
                    setPickupDate(value);
                  }}
                  disablePast
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Return Date"
                  value={returnDate}
                  onChange={value => {
                    setReturnDate(value);
                  }}
                  minDate={pickupDate ?? new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: showDateError,
                      helperText: showDateError ? "Return date must be after pickup date" : "",
                    },
                  }}
                />
              </LocalizationProvider>
              <Autocomplete
                freeSolo
                options={pickupLocationOptions}
                loading={pickupLocationLoading}
                inputValue={pickupLocation}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                    },
                  },
                }}
                onInputChange={(_, value) => {
                  setPickupLocation(value);
                }}
                onChange={(_, value) => {
                  if (typeof value === "string") {
                    setPickupLocation(value);
                  } else if (value?.label) {
                    setPickupLocation(value.label);
                  }
                }}
                getOptionLabel={option => (typeof option === "string" ? option : option.label)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Pickup Location"
                    placeholder="e.g. Cairo International Airport"
                    fullWidth
                    slotProps={{
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
                freeSolo
                options={dropOffLocationOptions}
                loading={dropOffLocationLoading}
                inputValue={dropOffLocation}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: theme => darken(theme.palette.background.paper, 0.04),
                    },
                  },
                }}
                onInputChange={(_, value) => {
                  setDropOffLocation(value);
                }}
                onChange={(_, value) => {
                  if (typeof value === "string") {
                    setDropOffLocation(value);
                  } else if (value?.label) {
                    setDropOffLocation(value.label);
                  }
                }}
                getOptionLabel={option => (typeof option === "string" ? option : option.label)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Dropoff Location"
                    placeholder="e.g. Downtown Office"
                    fullWidth
                    slotProps={{
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
            title="Vehicle"
            subtitle="Only available vehicles are shown for the selected dates"
            done={vehicleDone}
          >
            <TextField
              placeholder="Search by make, model, or plate…"
              value={vehicleSearch}
              onChange={e => {
                setVehicleSearch(e.target.value);
              }}
              fullWidth
              size="small"
              sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: vehicleLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            {vehicle ? (
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
                        {vehicle.plateNumber ?? "No plate"} · {vehicle.supplierName ?? "—"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Chip
                      label={`${formatCurrency(vehicle.dailyRate ?? 0)} / day`}
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
                      Change
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ) : (
              <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
                {vehicleOptions.length === 0 && !vehicleLoading && (
                  <Typography variant="body2" color="text.secondary">
                    No available vehicles for the selected window. Adjust dates or search terms.
                  </Typography>
                )}
                <Stack spacing={1}>
                  {vehicleOptions.map(v => (
                    <Paper
                      key={v.id}
                      elevation={0}
                      onClick={() => {
                        setVehicle(v);
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Avatar
                          variant="rounded"
                          src={toImageUrl(v.thumbnail ?? undefined)}
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: "primary.main",
                          }}
                        >
                          <CarIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600 }} noWrap>
                            {v.name || "Unnamed"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {v.plateNumber ?? "No plate"} · {v.supplierName ?? "—"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: "success.main" }}>
                          {formatCurrency(v.dailyRate ?? 0)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
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
          <Typography sx={{ fontWeight: 700, mb: 2 }}>Pricing Summary</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Daily Rate
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatCurrency(dailyRate)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Total Days
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {datesValid ? `${String(totalDays)} day${daysString}` : "—"}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Total Price
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "success.main" }}>
                {formatCurrency(totalPrice)}
              </Typography>
            </Stack>
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Pricing updates live as you change vehicle and dates.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The server confirms the final amount on save.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Payment is collected through a separate flow — creating a booking does not require completing payment.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
