"use client";

import React from "react";
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  SelectChangeEvent,
} from "@mui/material";
import { SearchRounded as SearchIcon } from "@mui/icons-material";

interface BookingsFilterBarProps {
  readonly search: string;
  readonly onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly statusFilter: string;
  readonly onStatusFilterChange: (status: string) => void;
  readonly fromDate: string;
  readonly onFromDateChange: (date: string) => void;
  readonly toDate: string;
  readonly onToDateChange: (date: string) => void;
  readonly t: (key: string) => string;
  readonly tCommon: (key: string) => string;
}

export default function BookingsFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  t,
  tCommon,
}: BookingsFilterBarProps) {
  const handleStatusChange = (e: SelectChangeEvent) => {
    onStatusFilterChange(e.target.value);
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        alignItems: { md: "center" },
      }}
    >
      <TextField
        placeholder={t("filters.searchPlaceholder")}
        value={search}
        onChange={onSearchChange}
        size="small"
        sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{tCommon("status")}</InputLabel>
        <Select value={statusFilter} label={tCommon("status")} onChange={handleStatusChange} sx={{ borderRadius: 2 }}>
          <MenuItem value="All">{t("filters.statuses.all")}</MenuItem>
          <MenuItem value="Draft">{t("filters.statuses.draft")}</MenuItem>
          <MenuItem value="PaymentPending">{t("filters.statuses.paymentPending")}</MenuItem>
          <MenuItem value="Confirmed">{t("filters.statuses.confirmed")}</MenuItem>
          <MenuItem value="Active">{t("filters.statuses.active")}</MenuItem>
          <MenuItem value="Completed">{t("filters.statuses.completed")}</MenuItem>
          <MenuItem value="Cancelled">{t("filters.statuses.cancelled")}</MenuItem>
        </Select>
      </FormControl>
      <TextField
        type="date"
        label={t("filters.dateFrom")}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
        value={fromDate}
        onChange={e => {
          onFromDateChange(e.target.value);
        }}
        sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
      <TextField
        type="date"
        label={t("filters.dateTo")}
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
        value={toDate}
        onChange={e => {
          onToDateChange(e.target.value);
        }}
        sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
    </Stack>
  );
}
