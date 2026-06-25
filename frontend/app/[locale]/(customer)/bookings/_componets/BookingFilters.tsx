"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  InputAdornment,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

interface BookingFiltersProps {
  readonly onFilterChange: (statuses: readonly string[], keyword: string, sortBy: string, sortOrder: string) => void;
}

const ALL_STATUSES = ["Draft", "PaymentPending", "Confirmed", "Active", "Completed", "Cancelled"] as const;

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date: Newest First", sortBy: "date", sortOrder: "desc" },
  { value: "date_asc", label: "Date: Oldest First", sortBy: "date", sortOrder: "asc" },
  { value: "price_asc", label: "Price: Low to High", sortBy: "price", sortOrder: "asc" },
  { value: "price_desc", label: "Price: High to Low", sortBy: "price", sortOrder: "desc" },
  { value: "status_asc", label: "Status: A to Z", sortBy: "status", sortOrder: "asc" },
  { value: "status_desc", label: "Status: Z to A", sortBy: "status", sortOrder: "desc" },
] as const;

export default function BookingFilters({ onFilterChange }: Readonly<BookingFiltersProps>) {
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortValue, setSortValue] = useState("date_desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      const statusesToFetch = selectedStatus === "All" ? [...ALL_STATUSES] : [selectedStatus];
      const selectedSort = SORT_OPTIONS.find(opt => opt.value === sortValue) ?? SORT_OPTIONS[0];
      onFilterChange(statusesToFetch, keyword, selectedSort.sortBy, selectedSort.sortOrder);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [keyword, selectedStatus, sortValue, onFilterChange]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "border.main",
        bgcolor: "background.paper",
        boxShadow: "shadow.card",
      }}
    >
      {/* Search */}
      <TextField
        size="small"
        placeholder="Search cars or locations..."
        value={keyword}
        onChange={e => {
          setKeyword(e.target.value);
        }}
        fullWidth
        sx={{
          maxWidth: { md: 400 },
          "& .MuiOutlinedInput-root": {
            fontSize: { xs: "1rem", md: "0.875rem" },
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          justifyContent: "space-between",
          alignItems: { md: "flex-end" },
        }}
      >
        {/* Status filters */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              fontWeight: 700,
            }}
          >
            Filter by Status:
          </Typography>

          {/* Mobile: Scrollable chips, Desktop: Button group */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              gap: 1,
              overflowX: "auto",
              pb: 1,
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <Button
              size="small"
              variant={selectedStatus === "All" ? "contained" : "outlined"}
              onClick={() => {
                setSelectedStatus("All");
              }}
              sx={{
                minWidth: "auto",
                px: 2,
                flexShrink: 0,
                fontSize: "0.75rem",
              }}
            >
              All
            </Button>
            {ALL_STATUSES.map(status => (
              <Button
                key={status}
                size="small"
                variant={selectedStatus === status ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedStatus(status);
                }}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  flexShrink: 0,
                  fontSize: "0.75rem",
                }}
              >
                {status}
              </Button>
            ))}
          </Box>

          {/* Desktop: Button group */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={selectedStatus === "All" ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedStatus("All");
                }}
              >
                All
              </Button>
              {ALL_STATUSES.map(status => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "contained" : "outlined"}
                  onClick={() => {
                    setSelectedStatus(status);
                  }}
                >
                  {status}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </Box>

        {/* Sorting Dropdown */}
        <Box sx={{ minWidth: { xs: "100%", md: 240 } }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              fontWeight: 700,
            }}
          >
            Sort by:
          </Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={sortValue}
              onChange={e => {
                setSortValue(e.target.value);
              }}
              sx={{
                fontSize: { xs: "1rem", md: "0.875rem" },
                borderRadius: 2,
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: { xs: "1rem", md: "0.875rem" } }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
}
