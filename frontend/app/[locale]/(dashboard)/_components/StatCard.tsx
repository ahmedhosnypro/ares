"use client";

import React, { useMemo } from "react";
import { Card, Box, Avatar, Typography, useTheme, alpha, Stack } from "@mui/material";

interface StatCardProps {
  readonly title: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly trend?: {
    readonly value?: number;
    readonly label: string;
    readonly isUp?: boolean;
  };
  readonly color?: "primary" | "success" | "warning" | "error" | "info" | string;
}

export default function StatCard({ title, value, icon, trend, color = "primary" }: StatCardProps) {
  const theme = useTheme();

  const mainColor = useMemo(() => {
    const isPaletteColor = color in theme.palette;
    return isPaletteColor ? (theme.palette[color as keyof typeof theme.palette] as { main: string }).main : color;
  }, [color, theme]);

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(mainColor, 0.08)} 100%)`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${alpha(mainColor, 0.18)}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -18,
          right: -18,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: alpha(mainColor, 0.1),
        }}
      />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar sx={{ bgcolor: alpha(mainColor, 0.15), color: mainColor, width: 40, height: 40 }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: mainColor,
              lineHeight: 1.1,
              fontSize: { xs: "1.6rem", sm: "2.125rem" },
            }}
            noWrap
          >
            {value}
          </Typography>
          {trend && (
            <Typography
              variant="caption"
              sx={{ color: trend.isUp ? "success.main" : "error.main", display: "block", mt: 0.5, fontWeight: 600 }}
            >
              {trend.label}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
