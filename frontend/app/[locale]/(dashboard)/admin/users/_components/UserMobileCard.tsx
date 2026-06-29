"use client";

import { useCallback } from "react";
import { Paper, Stack, Avatar, Box, Typography, Chip, IconButton, Tooltip, alpha, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { toggleUserStatus, type User } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";

interface UserMobileCardProps {
  readonly user: User;
  readonly onRefresh: () => void;
  readonly onRequestDelete: (user: User) => void;
}

export default function UserMobileCard({ user, onRefresh, onRequestDelete }: UserMobileCardProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.users");
  const isActive = (user.status || "").toLowerCase() === "active";

  const handleToggleStatus = useCallback(async () => {
    try {
      await toggleUserStatus(user.id);
      onRefresh();
    } catch (err) {
      logger.error("Failed to toggle user status", err);
    }
  }, [user.id, onRefresh]);

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      {/* Header row: avatar + name + status chip */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <Avatar
            src={(user.avatarUrl as string) || undefined}
            sx={{
              bgcolor: theme.palette.primary.light,
              fontWeight: 700,
              width: 40,
              height: 40,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {user.email}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={isActive ? t("form.active") : t("form.blocked")}
          size="small"
          sx={{
            ml: 1,
            flexShrink: 0,
            textTransform: "capitalize",
            bgcolor: isActive ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
            color: isActive ? theme.palette.success.main : theme.palette.error.main,
            fontWeight: 700,
            fontSize: 11,
          }}
        />
      </Stack>

      {/* Role label */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "capitalize", display: "block", mb: 1.5 }}
      >
        {t("details.role")}:{" "}
        <strong>{user.roles.map(r => t(`form.roles.${r.toLowerCase()}`)).join(", ") || "—"}</strong>
      </Typography>

      {/* Action buttons */}
      <Stack direction="row" spacing={1}>
        <Tooltip title={t("table.viewDetails")}>
          <IconButton component={Link} href={`/admin/users/${user.id}`} size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t("table.editAccount")}>
          <IconButton component={Link} href={`/admin/users/${user.id}/edit`} size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
          <IconButton
            size="small"
            onClick={() => {
              void handleToggleStatus();
            }}
            sx={{ color: isActive ? "error.main" : "success.main" }}
          >
            {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("table.delete")}>
          <IconButton
            size="small"
            onClick={() => {
              onRequestDelete(user);
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
