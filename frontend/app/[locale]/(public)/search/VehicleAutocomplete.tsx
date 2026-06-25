"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Autocomplete, TextField, Box, Typography, Avatar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import type { PublicVehicleCard } from "@/utils/public-data";
import { toImageUrl } from "@/utils/image-url";

interface VehicleAutocompleteProps {
  readonly vehicles: readonly PublicVehicleCard[];
}

export default function VehicleAutocomplete({ vehicles }: VehicleAutocompleteProps) {
  const router = useRouter();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");

  // Limit to 10 results for autocomplete
  const limitedVehicles = useMemo(() => {
    return vehicles.slice(0, 10);
  }, [vehicles]);

  // Filter vehicles based on search input
  const filteredVehicles = useMemo(() => {
    if (!inputValue.trim()) {
      return limitedVehicles;
    }

    const searchTerm = inputValue.toLowerCase();
    return limitedVehicles.filter(vehicle => {
      const makeModel = `${vehicle.make} ${vehicle.model}`.toLowerCase();
      const location = vehicle.locationCity.toLowerCase();
      const category = vehicle.status.toLowerCase();

      return makeModel.includes(searchTerm) || location.includes(searchTerm) || category.includes(searchTerm);
    });
  }, [inputValue, limitedVehicles]);

  const handleVehicleSelect = (vehicle: PublicVehicleCard | null) => {
    if (vehicle) {
      router.push(`/vehicles/${vehicle.vehicleId}`);
    }
  };

  return (
    <Box sx={{ width: "100%", mx: "auto" }}>
      <Autocomplete
        options={filteredVehicles}
        getOptionLabel={option => `${option.make} ${option.model}`}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(_, newValue) => {
          handleVehicleSelect(newValue);
        }}
        filterOptions={x => x} // We handle filtering ourselves
        noOptionsText={inputValue ? "No vehicles found" : "Start typing to search..."}
        renderInput={params => (
          <TextField
            {...params}
            placeholder="Search by make, model, or location..."
            variant="outlined"
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <DirectionsCarRoundedIcon
                      sx={{
                        color: "text.secondary",
                        mr: 1,
                        ml: 0.5,
                      }}
                    />
                    {params.slotProps.input.startAdornment}
                  </>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                bgcolor: "background.paper",
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
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          const imageUrl = toImageUrl(option.imageUrl);

          return (
            <Box
              component="li"
              key={key}
              {...otherProps}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                px: 2,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              {imageUrl ? (
                <Box
                  sx={{
                    position: "relative",
                    width: 60,
                    height: 40,
                    borderRadius: "8px",
                    overflow: "hidden",
                    bgcolor: "background.default",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={`${option.make} ${option.model}`}
                    fill
                    sizes="60px"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                </Box>
              ) : (
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                  }}
                >
                  <DirectionsCarRoundedIcon />
                </Avatar>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }} noWrap>
                  {option.make} {option.model}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.locationCity || "Available"} • ${option.dailyRate}/day
                  {option.status && ` • ${option.status}`}
                </Typography>
              </Box>
            </Box>
          );
        }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              mt: 1,
              borderRadius: "16px",
              border: `1px solid ${theme.palette.border.light}`,
              boxShadow: theme.palette.shadow.card,
            },
          },
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mt: 1,
          ml: 2,
          fontSize: "0.75rem",
        }}
      >
        Showing up to 10 vehicles matching your filters
      </Typography>
    </Box>
  );
}
