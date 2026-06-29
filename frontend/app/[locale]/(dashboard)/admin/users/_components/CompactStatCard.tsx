"use client";

import React from "react";
import { Paper, Avatar, Box, Stack, Typography, useTheme, alpha } from "@mui/material";
import { useTranslations } from "next-intl";

export interface CompactStatCardProps {
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly icon: React.ReactNode;
  readonly trendText?: string;
  readonly isUp?: boolean;
}

export default function CompactStatCard({ label, value, color, icon, trendText, isUp = true }: CompactStatCardProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.users");

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 1.25 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1.5, md: 1 }}
        sx={{ alignItems: "center", mb: { xs: 1, md: 0.5 }, minWidth: 0 }}
      >
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.12),
            color: color,
            width: { xs: 40, md: 32 },
            height: { xs: 40, md: 32 },
            flexShrink: 0,
            "& .MuiSvgIcon-root": { fontSize: { xs: 22, md: 18 } },
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ fontWeight: 700, display: "block", fontSize: { xs: 11, md: 9.5 }, lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 800, color: "text.primary", mt: 0.1, fontSize: { xs: 18, md: 14 }, lineHeight: 1.1 }}
          >
            {value.toLocaleString()}
          </Typography>
        </Box>
      </Stack>

      {trendText && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: isUp ? theme.palette.status.active.main : theme.palette.status.blocked.main,
              fontSize: { xs: 10, md: 8.5 },
              display: "flex",
              alignItems: "center",
              gap: 0.2,
              lineHeight: 1,
            }}
          >
            {isUp ? "↑" : "↓"} {trendText}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: { xs: 9, md: 8 },
              lineHeight: 1,
              display: { xs: "inline", md: "none", lg: "inline" },
            }}
          >
            {t("stats.thisMonth")}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
