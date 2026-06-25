"use client";

import { Card, CardContent, Grid, Stack, Avatar, Box, Typography, useTheme } from "@mui/material";
import DriverAvailabilityToggle from "../../_components/DriverAvailabilityToggle";

interface DashboardHeaderProps {
  readonly userName?: string;
  readonly initialAvailability: "Available" | "Unavailable" | "Reserved";
  readonly onAvailabilityChange?: (newAvailability: string) => void;
}

export default function DashboardHeader({ userName, initialAvailability, onAvailabilityChange }: DashboardHeaderProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.light",
        bgcolor: "overlay.blur",
        backdropFilter: "blur(20px)",
        boxShadow: theme.palette.shadow.card,
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Grid container spacing={3} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  width: { xs: 60, sm: 72 },
                  height: { xs: 60, sm: 72 },
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 700,
                  fontSize: "1.5rem",
                }}
              >
                {userName?.[0] || "C"}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                  Welcome back, {userName || "Chauffeur"}!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ARES Premium Chauffeur Portal • Shift Active and monitored.
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <Box
              sx={{
                bgcolor: "background.paper",
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "border.light",
                boxShadow: theme.palette.shadow.card,
              }}
            >
              <DriverAvailabilityToggle
                initialAvailability={initialAvailability}
                onAvailabilityChange={onAvailabilityChange}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
