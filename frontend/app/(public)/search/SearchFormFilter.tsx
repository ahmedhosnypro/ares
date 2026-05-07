"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, MenuItem, Paper, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VehicleAutocomplete from "./VehicleAutocomplete";
import { PublicVehicleCard } from "@/utils/public-data";

interface Location {
  id: string;
  label: string;
}

interface SearchFormFilterProps {
  readonly locations: readonly Location[];
  readonly defaultLocationId: string;
  readonly defaultPickupDate: string;
  readonly defaultReturnDate: string;
  readonly defaultCategory?: string;
  readonly vehicles: readonly PublicVehicleCard[];
}

export default function SearchFormFilter({
  locations,
  defaultLocationId,
  defaultPickupDate,
  defaultReturnDate,
  defaultCategory,
  vehicles,
}: SearchFormFilterProps) {
  const router = useRouter();
  const theme = useTheme();
  const [pickupLocationId, setPickupLocationId] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(new Date(defaultPickupDate));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(defaultReturnDate));
  const [category, setCategory] = useState(defaultCategory || "");

  const vehicleCategories = [
    { value: "", label: "All Categories" },
    { value: "Compact", label: "Compact & Mini" },
    { value: "Standard", label: "Mid-Size & Standard" },
    { value: "Premium", label: "SUVs & Maxi" },
  ];

  const formatDateForUrl = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      pickupLocationId,
      pickupDate: formatDateForUrl(pickupDate),
      returnDate: formatDateForUrl(returnDate),
    });

    // Only add category if it's not empty (not "All Categories")
    if (category) {
      params.set("category", category);
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
              lg: "2fr 1fr 1fr 1.5fr auto", // Desktop: single row with category filter
            },
            alignItems: "end",
          }}
        >
          {/* Location Selector */}
          <TextField
            select
            label="Pickup location"
            value={pickupLocationId}
            onChange={e => {
              setPickupLocationId(e.target.value);
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
            {locations.map(location => (
              <MenuItem key={location.id} value={location.id}>
                {location.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Pickup Date */}
          <DatePicker
            label="Pickup date"
            value={pickupDate}
            onChange={newValue => {
              setPickupDate(newValue);
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
            label="Return date"
            value={returnDate}
            onChange={newValue => {
              setReturnDate(newValue);
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
            label="Vehicle class"
            value={category}
            onChange={e => {
              setCategory(e.target.value);
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

          {/* Search Button */}
          <Button
            variant="contained"
            color="primary"
            endIcon={<SearchRoundedIcon />}
            onClick={handleSearch}
            sx={{
              minWidth: { xs: "100%", lg: "160px" },
              minHeight: "56px", // Match input height
              borderRadius: "12px",
              px: 3,
              fontSize: "1rem",
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: theme.palette.shadow.button,
              "&:hover": {
                boxShadow: theme.palette.shadow.buttonHover,
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Search cars
          </Button>
        </Box>

        {/* Vehicle Autocomplete Search */}
        <Box sx={{ width: "100%", maxWidth: "1000px", mt: 3 }}>
          <VehicleAutocomplete vehicles={vehicles} />
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
