"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/routing";
import { Box, Paper, Stack, Typography, IconButton, Tooltip, useTheme, alpha } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CarRepairIcon from "@mui/icons-material/CarRepair";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import type { InspectorTask } from "@/api-clients/inspections/inspections";

interface TodayTaskCardProps {
  readonly task: InspectorTask;
}

export default function TodayTaskCard({ task }: TodayTaskCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const t = useTranslations("dashboard.inspectorInspections.taskCard");

  const isCheckOut = task.inspectionType === "CheckOut";

  const accentColor = isCheckOut ? theme.palette.status.active.main : theme.palette.status.cancelled.main;

  const accentLight = isCheckOut ? theme.palette.status.active.light : theme.palette.status.cancelled.light;

  const typeLabel = isCheckOut ? t("checkOut") : t("checkIn");
  const TypeIcon = isCheckOut ? DirectionsCarIcon : CarRepairIcon;

  const scheduledDate = new Date(task.scheduledTime);
  const formattedTime = scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const mapsHref = task.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(task.address)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(task.vehicleName)}`;

  function handleCardClick() {
    router.push(`/inspector/inspections/${task.inspectionId}`);
  }

  function stopBubble(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: `4px solid ${accentColor}`,
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: accentColor,
          borderLeftColor: accentColor,
          boxShadow: theme.palette.shadow.cardHover,
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      }}
    >
      {/* Type badge strip */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          bgcolor: alpha(accentColor, 0.08),
          borderBottom: "1px solid",
          borderColor: alpha(accentColor, 0.15),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
          <TypeIcon sx={{ fontSize: 16, color: accentColor }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: accentColor, letterSpacing: "0.03em" }}>
            {typeLabel}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: "middle" }} />
          {formattedTime}
        </Typography>
      </Box>

      {/* Card body */}
      <Box sx={{ px: 2, py: 1.75 }}>
        {/* Vehicle info — prominent */}
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.25 }} noWrap>
              {task.vehicleName}
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: accentLight,
                borderRadius: 1,
                px: 1,
                py: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: accentColor, letterSpacing: "0.08em" }}>
                {task.plateNumber || "—"}
              </Typography>
            </Box>
          </Box>
        </Stack>

        {/* Customer info */}
        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
            <PersonIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
              {task.customerName}
            </Typography>
          </Stack>
          {task.address && (
            <Stack direction="row" sx={{ alignItems: "flex-start", gap: 0.75 }}>
              <PlaceIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0, mt: 0.2 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
                {task.address}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Action buttons — independent, stop propagation */}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Tooltip title={t("callCustomer", { customerName: task.customerName })} arrow>
            <IconButton
              component="a"
              href={`tel:${task.customerPhone}`}
              onClick={stopBubble}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.icon.phone.color, 0.1),
                color: theme.palette.icon.phone.color,
                border: "1px solid",
                borderColor: alpha(theme.palette.icon.phone.color, 0.2),
                "&:hover": {
                  bgcolor: alpha(theme.palette.icon.phone.color, 0.18),
                },
                width: 36,
                height: 36,
              }}
              aria-label={t("callCustomer", { customerName: task.customerName })}
            >
              <PhoneIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={t("openInMaps")} arrow>
            <IconButton
              component="a"
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stopBubble}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                border: "1px solid",
                borderColor: alpha(theme.palette.info.main, 0.2),
                "&:hover": {
                  bgcolor: alpha(theme.palette.info.main, 0.18),
                },
                width: 36,
                height: 36,
              }}
              aria-label={t("openInMapsAriaLabel")}
            >
              <PlaceIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
}
