"use client";

import {
  Card,
  Stack,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  type SelectChangeEvent,
} from "@mui/material";
import { useTranslations } from "next-intl";
import SearchIcon from "@mui/icons-material/Search";

interface UserFiltersBarProps {
  readonly search: string;
  readonly roleFilter: string;
  readonly statusFilter: string;
  readonly onSearchChange: (value: string) => void;
  readonly onRoleChange: (value: string) => void;
  readonly onStatusChange: (value: string) => void;
}

export default function UserFiltersBar({
  search,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: UserFiltersBarProps) {
  const t = useTranslations("dashboardAdmin.users");

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ p: 2, bgcolor: "background.paper", alignItems: { md: "center" } }}
      >
        <TextField
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={e => { onSearchChange(e.target.value); }}
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
          <Select
            value={roleFilter}
            onChange={(e: SelectChangeEvent) => { onRoleChange(e.target.value); }}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">{t("filters.allRoles")}</MenuItem>
            <MenuItem value="admin">{t("form.roles.admin")}</MenuItem>
            <MenuItem value="customer">{t("form.roles.customer")}</MenuItem>
            <MenuItem value="supplier">{t("form.roles.supplier")}</MenuItem>
            <MenuItem value="driver">{t("form.roles.driver")}</MenuItem>
            <MenuItem value="inspector">{t("form.roles.inspector")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={(e: SelectChangeEvent) => { onStatusChange(e.target.value); }}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">{t("filters.allStatuses")}</MenuItem>
            <MenuItem value="active">{t("form.active")}</MenuItem>
            <MenuItem value="blocked">{t("form.blocked")}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Card>
  );
}
