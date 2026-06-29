"use client";

import { useState } from "react";
import { useRouter } from "@/shared/i18n/routing";
import { useTranslations } from "next-intl";
import { Box, MenuItem, Paper, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import VehicleAutocomplete from "./VehicleAutocomplete";
import { PublicCategory, PublicVehicleCard } from "@/utils/public-data";

interface Location {
  id: string;
  label: string;
}

interface SearchFormFilterProps {
  readonly locations: readonly Location[];
  readonly categories: readonly PublicCategory[];
  readonly defaultLocationId: string;
  readonly defaultPickupDate: string;
  readonly defaultReturnDate: string;
  readonly defaultCategory?: string;
  readonly defaultTransmission?: string;
  readonly defaultSort?: string;
  readonly vehicles: readonly PublicVehicleCard[];
}

export default function SearchFormFilter({
  locations,
  categories,
  defaultLocationId,
  defaultPickupDate,
  defaultReturnDate,
  defaultCategory,
  defaultTransmission,
  defaultSort,
  vehicles,
}: SearchFormFilterProps) {
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslations("publicPages.search");
  const [pickupLocationId, setPickupLocationId] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(new Date(defaultPickupDate));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(defaultReturnDate));
  const [category, setCategory] = useState(defaultCategory || "");
  const [transmission, setTransmission] = useState(defaultTransmission || "");
  const [sort, setSort] = useState(defaultSort || "");

  const vehicleCategories = [
    { value: "", label: t("allCategories") },
    ...categories.map(c => ({ value: c.name, label: c.name })),
  ];

  const transmissionOptions = [
    { value: "", label: t("allTransmissions") },
    { value: "Automatic", label: t("automatic") },
    { value: "Manual", label: t("manual") },
  ];

  const sortOptions = [
    { value: "", label: t("sortDefault") },
    { value: "newest", label: t("newestFirst") },
    { value: "price", label: t("priceLowToHigh") },
    { value: "rating", label: t("topRated") },
  ];

  const formatDateForUrl = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleSearch = (
    updates: {
      pickupLocationId?: string;
      pickupDate?: Date | null;
      returnDate?: Date | null;
      category?: string;
      transmission?: string;
      sort?: string;
    } = {}
  ) => {
    const params = new URLSearchParams({
      pickupLocationId: updates.pickupLocationId ?? pickupLocationId,
      pickupDate: formatDateForUrl(updates.pickupDate !== undefined ? updates.pickupDate : pickupDate),
      returnDate: formatDateForUrl(updates.returnDate !== undefined ? updates.returnDate : returnDate),
    });

    const currentCategory = updates.category !== undefined ? updates.category : category;
    if (currentCategory) {
      params.set("category", currentCategory);
    }

    const currentTransmission = updates.transmission !== undefined ? updates.transmission : transmission;
    if (currentTransmission) {
      params.set("transmission", currentTransmission);
    }

    const currentSort = updates.sort !== undefined ? updates.sort : sort;
    if (currentSort) {
      params.set("sort", currentSort);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, lg: 4 }, // Reduced padding
          borderRadius: "20px", // Smaller border radius
          boxShadow: theme.palette.shadow.card,
          border: `1px solid ${theme.palette.border.main}`,
          bgcolor: "background.paper",
          width: "100%",
        }}
      >
        {/* Single row layout on desktop, stacked on mobile */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 3 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr",
              md: "1fr 1fr", // Two columns on tablet
              lg: "2fr 1.1fr 1.1fr 1.1fr 1.1fr 1.1fr", // Desktop: single row with category, transmission, sort filters
            },
            alignItems: "end",
          }}
        >
          {/* Location Selector */}
          <TextField
            select
            label={t("pickupLocation")}
            value={pickupLocationId}
            onChange={e => {
              const newValue = e.target.value;
              setPickupLocationId(newValue);
              handleSearch({ pickupLocationId: newValue });
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                minHeight: "56px", // Standard height
                fontSize: "1rem",
                "& fieldset": {
                  borderColor: theme.palette.border.main,
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiSelect-select": {
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            <MenuItem value="">
              <em>{t("selectALocation")}</em>
            </MenuItem>
            {locations.map(location => (
              <MenuItem key={location.id} value={location.id}>
                {location.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Pickup Date */}
          <DatePicker
            label={t("pickupDate")}
            value={pickupDate}
            onChange={newValue => {
              setPickupDate(newValue);
              handleSearch({ pickupDate: newValue });
            }}
            slotProps={{
              textField: {
                sx: {
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    minHeight: "56px",
                    fontSize: "1rem",
                    "& fieldset": {
                      borderColor: theme.palette.border.main,
                      borderWidth: "1px",
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  },
                },
              },
            }}
          />

          {/* Return Date */}
          <DatePicker
            label={t("returnDate")}
            value={returnDate}
            onChange={newValue => {
              setReturnDate(newValue);
              handleSearch({ returnDate: newValue });
            }}
            minDate={pickupDate || undefined}
            slotProps={{
              textField: {
                sx: {
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    minHeight: "56px",
                    fontSize: "1rem",
                    "& fieldset": {
                      borderColor: theme.palette.border.main,
                      borderWidth: "1px",
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: "2px",
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  },
                },
              },
            }}
          />

          {/* Category Filter */}
          <TextField
            select
            label={t("vehicleClass")}
            value={category}
            onChange={e => {
              const newValue = e.target.value;
              setCategory(newValue);
              handleSearch({ category: newValue });
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                minHeight: "56px",
                fontSize: "1rem",
                "& fieldset": {
                  borderColor: theme.palette.border.main,
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiSelect-select": {
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            {vehicleCategories.map(cat => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Transmission Filter */}
          <TextField
            select
            label={t("transmission")}
            value={transmission}
            onChange={e => {
              const newValue = e.target.value;
              setTransmission(newValue);
              handleSearch({ transmission: newValue });
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                minHeight: "56px",
                fontSize: "1rem",
                "& fieldset": {
                  borderColor: theme.palette.border.main,
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiSelect-select": {
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            {transmissionOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Sort Filter */}
          <TextField
            select
            label={t("sortBy")}
            value={sort}
            onChange={e => {
              const newValue = e.target.value;
              setSort(newValue);
              handleSearch({ sort: newValue });
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                minHeight: "56px",
                fontSize: "1rem",
                "& fieldset": {
                  borderColor: theme.palette.border.main,
                  borderWidth: "1px",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused fieldset": {
                  borderWidth: "2px",
                  borderColor: theme.palette.primary.main,
                },
              },
              "& .MuiSelect-select": {
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            {sortOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Vehicle Autocomplete Search */}
        <Box sx={{ width: "100%", mt: 3 }}>
          <VehicleAutocomplete vehicles={vehicles} />
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
