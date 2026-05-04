"use client";

import { useState, useEffect } from "react";
import { Box, Button, ButtonGroup, InputAdornment, TextField, Typography } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

interface BookingFiltersProps {
  readonly onFilterChange: (statuses: readonly string[], keyword: string) => void;
}

const ALL_STATUSES = ["Pending", "Confirmed", "Active", "Completed", "Cancelled"] as const;

export default function BookingFilters({ onFilterChange }: Readonly<BookingFiltersProps>) {
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    const timer = setTimeout(() => {
      const statusesToFetch = selectedStatus === "All" ? [...ALL_STATUSES] : [selectedStatus];
      onFilterChange(statusesToFetch, keyword);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [keyword, selectedStatus, onFilterChange]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: { xs: 2, md: 3 },
        borderRadius: 3,
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

      {/* Status filters - Mobile responsive */}
      <Box>
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
    </Box>
  );
}
