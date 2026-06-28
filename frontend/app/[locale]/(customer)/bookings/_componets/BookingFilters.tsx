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
import { useTranslations } from "next-intl";

interface BookingFiltersProps {
  readonly onFilterChange: (statuses: readonly string[], keyword: string, sortBy: string, sortOrder: string) => void;
}

type StatusFilterKey = "draft" | "pending" | "confirmed" | "active" | "completed" | "cancelled";

const STATUS_FILTERS: readonly { readonly key: StatusFilterKey; readonly apiValue: string }[] = [
  { key: "draft", apiValue: "Draft" },
  { key: "pending", apiValue: "PaymentPending" },
  { key: "confirmed", apiValue: "Confirmed" },
  { key: "active", apiValue: "Active" },
  { key: "completed", apiValue: "Completed" },
  { key: "cancelled", apiValue: "Cancelled" },
] as const;

const SORT_OPTIONS = [
  { value: "date_desc", labelKey: "filters.sortOptions.dateDesc" as const, sortBy: "date", sortOrder: "desc" },
  { value: "date_asc", labelKey: "filters.sortOptions.dateAsc" as const, sortBy: "date", sortOrder: "asc" },
  { value: "price_asc", labelKey: "filters.sortOptions.priceAsc" as const, sortBy: "price", sortOrder: "asc" },
  { value: "price_desc", labelKey: "filters.sortOptions.priceDesc" as const, sortBy: "price", sortOrder: "desc" },
  { value: "status_asc", labelKey: "filters.sortOptions.statusAsc" as const, sortBy: "status", sortOrder: "asc" },
  { value: "status_desc", labelKey: "filters.sortOptions.statusDesc" as const, sortBy: "status", sortOrder: "desc" },
] as const;

export default function BookingFilters({ onFilterChange }: Readonly<BookingFiltersProps>) {
  const t = useTranslations("customer.bookings");
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey | "all">("all");
  const [sortValue, setSortValue] = useState("date_desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      const filter = STATUS_FILTERS.find(f => f.key === selectedStatus);
      const statusesToFetch =
        selectedStatus === "all"
          ? STATUS_FILTERS.map(f => f.apiValue)
          : filter
            ? [filter.apiValue]
            : STATUS_FILTERS.map(f => f.apiValue);
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
      <TextField
        size="small"
        placeholder={t("filters.searchPlaceholder")}
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
            {t("filters.filterByStatus")}
          </Typography>

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
              variant={selectedStatus === "all" ? "contained" : "outlined"}
              onClick={() => {
                setSelectedStatus("all");
              }}
              sx={{
                minWidth: "auto",
                px: 2,
                flexShrink: 0,
                fontSize: "0.75rem",
              }}
            >
              {t("filters.all")}
            </Button>
            {STATUS_FILTERS.map(({ key }) => (
              <Button
                key={key}
                size="small"
                variant={selectedStatus === key ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedStatus(key);
                }}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  flexShrink: 0,
                  fontSize: "0.75rem",
                }}
              >
                {t(`list.status.${key}`)}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={selectedStatus === "all" ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedStatus("all");
                }}
              >
                {t("filters.all")}
              </Button>
              {STATUS_FILTERS.map(({ key }) => (
                <Button
                  key={key}
                  variant={selectedStatus === key ? "contained" : "outlined"}
                  onClick={() => {
                    setSelectedStatus(key);
                  }}
                >
                  {t(`list.status.${key}`)}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </Box>

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
            {t("filters.sortBy")}
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
                  {t(opt.labelKey)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
}
