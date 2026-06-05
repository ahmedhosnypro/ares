"use client";

import React from "react";
import { Card, CardContent, Box, Avatar, Typography, useTheme, alpha } from "@mui/material";

interface StatCardProps {
  readonly title: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly trend?: {
    readonly value?: number;
    readonly label: string;
  };
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: theme.palette.mode === "light" ? `0 4px 20px ${alpha(theme.palette.common.black, 0.02)}` : "none",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            theme.palette.mode === "light"
              ? `0 12px 28px ${alpha(theme.palette.common.black, 0.06)}`
              : `0 12px 28px ${alpha(theme.palette.common.black, 0.3)}`,
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.75rem" }}
          >
            {title}
          </Typography>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: "primary.main",
              width: 44,
              height: 44,
            }}
          >
            {icon}
          </Avatar>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.5px", color: "text.primary" }}>
          {value}
        </Typography>

        {trend && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 500 }}>
            {trend.label}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
