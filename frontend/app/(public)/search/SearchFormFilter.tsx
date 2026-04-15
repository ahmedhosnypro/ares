"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

interface Location {
  id: string;
  label: string;
}

interface SearchFormFilterProps {
  readonly locations: readonly Location[];
  readonly defaultLocationId: string;
  readonly defaultPickupDate: string;
  readonly defaultReturnDate: string;
}

export default function SearchFormFilter({
  locations,
  defaultLocationId,
  defaultPickupDate,
  defaultReturnDate,
}: SearchFormFilterProps) {
  const router = useRouter();
  const [pickupLocationId, setPickupLocationId] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(new Date(defaultPickupDate));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(defaultReturnDate));

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
    router.push(`/search?${params.toString()}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper 
        sx={{ 
          p: { xs: 2.5, md: 3 },
          borderRadius: "24px",
          boxShadow: "0 24px 60px rgba(15, 91, 91, 0.12)",
          border: "1px solid rgba(15, 91, 91, 0.1)",
          bgcolor: "#ffffff",
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end">
            <TextField
              select
              label="Pickup location"
              value={pickupLocationId}
              onChange={(e) => { setPickupLocationId(e.target.value); }}
              slotProps={{
                inputLabel: { shrink: true } // Force label to always float at top
              }}
              sx={{ 
                flex: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": {
                    borderColor: "rgba(15, 91, 91, 0.2)",
                  },
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderWidth: 2,
                    borderColor: "primary.main",
                  }
                }
              }}
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.label}
                </MenuItem>
              ))}
            </TextField>
            <DatePicker
              label="Pickup date"
              value={pickupDate}
              onChange={(newValue) => { setPickupDate(newValue); }}
              slotProps={{
                textField: {
                  sx: { 
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      "& fieldset": {
                        borderColor: "rgba(15, 91, 91, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused fieldset": {
                        borderWidth: 2,
                        borderColor: "primary.main",
                      }
                    }
                  }
                }
              }}
            />
            <DatePicker
              label="Return date"
              value={returnDate}
              onChange={(newValue) => { setReturnDate(newValue); }}
              minDate={pickupDate || undefined}
              slotProps={{
                textField: {
                  sx: { 
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      "& fieldset": {
                        borderColor: "rgba(15, 91, 91, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "primary.main",
                      },
                      "&.Mui-focused fieldset": {
                        borderWidth: 2,
                        borderColor: "primary.main",
                      }
                    }
                  }
                }
              }}
            />
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              Live search with real-time availability and comprehensive vehicle data.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SearchRoundedIcon />}
              onClick={handleSearch}
              sx={{ 
                minWidth: 220,
                borderRadius: "999px",
                py: 1.5,
                fontWeight: "bold",
                textTransform: "none",
                boxShadow: "0 8px 16px rgba(15, 91, 91, 0.3)",
                "&:hover": {
                  boxShadow: "0 12px 20px rgba(15, 91, 91, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Search cars
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
}
