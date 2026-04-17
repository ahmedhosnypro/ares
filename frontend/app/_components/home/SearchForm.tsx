"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface LocationOption {
  id: string;
  label: string;
}

interface LocationSuggestionApi {
  readonly locationId?: string;
  readonly displayText?: string;
}

interface SearchFormProps {
  readonly locations: readonly LocationOption[];
  readonly defaultLocationId: string;
  readonly defaultPickupDate: string;
  readonly defaultReturnDate: string;
}

export default function SearchForm({
  locations,
  defaultLocationId,
  defaultPickupDate,
  defaultReturnDate,
}: SearchFormProps) {
  const fallbackLocation = useMemo(() => {
    const found = locations.find(loc => loc.id === defaultLocationId);
    if (found) return found;
    return locations.length > 0 ? locations[0] : null;
  }, [locations, defaultLocationId]);

  const [locationOptions, setLocationOptions] = useState(locations);
  const [locationQuery, setLocationQuery] = useState(fallbackLocation ? fallbackLocation.label : "");
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(new Date(defaultPickupDate));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(defaultReturnDate));
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const formatDateForUrl = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const selectedLocation = useMemo(() => {
    const found = locationOptions.find(location => location.id === pickupLocation);
    return found ? found : fallbackLocation;
  }, [locationOptions, pickupLocation, fallbackLocation]);

  const fetchSuggestions = useCallback(
    async (query: string, active: boolean) => {
      setLoadingLocations(true);
      try {
        const response = await fetch(
          toApiUrl(`/api/locations/autocomplete?query=${encodeURIComponent(query)}&type=pickup`),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Autocomplete failed with ${String(response.status)}`);
        }

        const payload = (await response.json()) as { suggestions?: readonly LocationSuggestionApi[] };
        const suggestions = (payload.suggestions ?? [])
          .map(suggestion => {
            const id = suggestion.locationId ?? "";
            const label = suggestion.displayText ?? "";
            return id !== "" && label !== "" ? { id, label } : null;
          })
          .filter((item): item is LocationOption => item !== null);

        if (active) {
          const merged = [...suggestions];
          for (const location of locations) {
            if (!merged.some(option => option.id === location.id)) {
              merged.push(location);
            }
          }
          setLocationOptions(merged);
        }
      } catch (error) {
        logger.error("SearchForm location autocomplete error", error);
        if (active) {
          setLocationOptions(locations);
        }
      } finally {
        if (active) {
          setLoadingLocations(false);
        }
      }
    },
    [locations]
  );

  useEffect(() => {
    const trimmedQuery = locationQuery.trim();
    if (trimmedQuery.length < 3) {
      setLoadingLocations(false);
      setLocationOptions(locations);
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      void fetchSuggestions(trimmedQuery, active);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [locationQuery, locations, fetchSuggestions]);

  const applyDatePreset = (preset: string) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const nextPickup = new Date(base);
    const nextReturn = new Date(base);

    if (preset === "tomorrow") {
      nextPickup.setDate(nextPickup.getDate() + 1);
      nextReturn.setDate(nextReturn.getDate() + 4);
    } else if (preset === "weekend") {
      const daysUntilFriday = (5 - base.getDay() + 7) % 7 || 7;
      nextPickup.setDate(nextPickup.getDate() + daysUntilFriday);
      nextReturn.setDate(nextPickup.getDate() + 2);
    } else if (preset === "week") {
      nextPickup.setDate(nextPickup.getDate() + 1);
      nextReturn.setDate(nextPickup.getDate() + 8);
    }

    setPickupDate(nextPickup);
    setReturnDate(nextReturn);
    setActivePreset(preset);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: -5, md: -6 },
          position: "relative",
          zIndex: 5,
          mb: 8,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: { xs: "stretch", md: "flex-end" },
            gap: 2,
            bgcolor: "background.paper",
          }}
        >
          <Autocomplete
            loading={loadingLocations}
            options={locationOptions}
            value={selectedLocation}
            onChange={(_, newValue) => {
              if (newValue) {
                setPickupLocation(newValue.id);
                setLocationQuery(newValue.label);
              }
            }}
            inputValue={locationQuery}
            onInputChange={(_, newInputValue) => {
              setLocationQuery(newInputValue);
              setActivePreset(null);
            }}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ flex: { xs: "1 1 100%", md: "1 1 25%" } }}
            renderInput={params => (
              <TextField
                {...params}
                label="Pickup location"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: 2,
                    },
                  },
                }}
              />
            )}
          />
          <DatePicker
            label="Pickup date"
            value={pickupDate}
            onChange={newValue => {
              setPickupDate(newValue);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  flex: { xs: "1 1 100%", md: "1 1 15%" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: 2,
                    },
                  },
                },
              },
            }}
          />
          <DatePicker
            label="Return date"
            value={returnDate}
            onChange={newValue => {
              setReturnDate(newValue);
            }}
            minDate={pickupDate ? pickupDate : undefined}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  flex: { xs: "1 1 100%", md: "1 1 15%" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: 2,
                    },
                  },
                },
              },
            }}
          />
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 20%" } }}>
            <Link
              href={`/search?pickupLocationId=${pickupLocation}&pickupDate=${formatDateForUrl(pickupDate)}&returnDate=${formatDateForUrl(returnDate)}`}
              style={{ textDecoration: "none" }}
            >
              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                sx={{
                  height: 56,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  borderRadius: 1.5,
                  textTransform: "none",
                  boxShadow: 2,
                  "&:hover": {
                    boxShadow: 4,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Search cars
              </Button>
            </Link>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ flex: "1 1 100%", alignItems: "center", justifyContent: "center" }}
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              color="primary"
              value={activePreset}
              onChange={(_, value) => {
                if (typeof value === "string" && value !== "") {
                  applyDatePreset(value);
                }
              }}
              sx={{
                mx: "auto",
                gap: { xs: 0, md: 0.75 },
                "& .MuiToggleButtonGroup-grouped": {
                  px: { xs: 1.25, md: 2.25 },
                },
              }}
            >
              <ToggleButton value="tomorrow">Tomorrow</ToggleButton>
              <ToggleButton value="weekend">Weekend</ToggleButton>
              <ToggleButton value="week">1 Week</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
