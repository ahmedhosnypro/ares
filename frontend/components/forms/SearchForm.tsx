"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Container,
  MenuItem,
  Paper,
  TextField,
  Link as MuiLink,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface Location {
  id: string;
  label: string;
}

interface SearchFormProps {
  readonly locations: readonly Location[];
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
  const [pickupLocation, setPickupLocation] = useState(defaultLocationId);
  const [pickupDate, setPickupDate] = useState<Date | null>(new Date(defaultPickupDate));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(defaultReturnDate));

  // Format date to YYYY-MM-DD for URL
  const formatDateForUrl = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: -5, md: -6 }, 
          position: "relative", 
          zIndex: 5, 
          mb: 8 
        }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            p: { xs: 2.5, md: 3 }, // Increased padding for better breathing room
            borderRadius: 2, // Reduced from 3 (24px) to 2 (16px) for more structured look
            display: "flex", 
            flexWrap: "wrap", 
            alignItems: "flex-end", // Align to bottom for consistent baseline
            gap: 2, 
            bgcolor: "background.paper",
          }}
        >
          <TextField
            fullWidth
            select
            label="Pickup location"
            value={pickupLocation}
            onChange={(e) => { setPickupLocation(e.target.value); }}
            slotProps={{
              inputLabel: { shrink: true } // Force label to always float at top
            }}
            sx={{ 
              flex: { xs: "1 1 100%", md: "1 1 25%" },
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5, // Subtle rounding (12px) consistent with other inputs
                "& fieldset": {
                  borderColor: "divider", // Softer, lighter border
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderWidth: 2,
                }
              }
            }}
          >
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.label}
              </MenuItem>
            ))}
          </TextField>
          <DatePicker
            label="Pickup date"
            value={pickupDate}
            onChange={(newValue) => { setPickupDate(newValue); }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { 
                  flex: { xs: "1 1 100%", md: "1 1 15%" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5, // Consistent subtle rounding
                    "& fieldset": {
                      borderColor: "divider", // Softer border
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: 2,
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
                fullWidth: true,
                sx: { 
                  flex: { xs: "1 1 100%", md: "1 1 15%" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5, // Consistent subtle rounding
                    "& fieldset": {
                      borderColor: "divider", // Softer border
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderWidth: 2,
                    }
                  }
                }
              }
            }}
          />
          <MuiLink
            href={`/search?pickupLocation=${pickupLocation}&pickupDate=${formatDateForUrl(pickupDate)}&returnDate=${formatDateForUrl(returnDate)}`}
            component={Link}
            underline="none"
            sx={{ flex: { xs: "1 1 100%", md: "1 1 20%" } }}
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
                borderRadius: 1.5, // Reduced from pill shape to subtle rounding (12px)
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
          </MuiLink>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
