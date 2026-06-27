"use client";

import { Card, CardContent, Box, Typography, Stack, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { CalendarToday as CalendarIcon } from "@mui/icons-material";

interface UpcomingTrip {
  readonly id: string;
  readonly date: string;
  readonly clientName: string;
  readonly vehicleModel: string;
  readonly payout: string;
  readonly duration: string;
}

interface UpcomingScheduleProps {
  readonly trips: readonly UpcomingTrip[];
}

export default function UpcomingSchedule({ trips }: UpcomingScheduleProps) {
  const theme = useTheme();
  const t = useTranslations("dashboard.driverDashboard.upcomingSchedule");

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 2,
        border: "1px solid",
        borderColor: "border.light",
        bgcolor: "background.paper",
        boxShadow: theme.palette.shadow.card,
        flexGrow: 1,
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "border.light",
          bgcolor: "overlay.blur",
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarIcon color="primary" fontSize="small" /> {t("calendarAndShiftSchedule")}
        </Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {trips.map(trip => (
            <Box
              key={trip.id}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "border.light",
                bgcolor: "background.default",
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateX(4px)",
                  borderColor: "primary.main",
                  boxShadow: theme => theme.palette.shadow.card,
                },
              }}
            >
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {trip.clientName}
                  </Typography>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                    {trip.payout}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <Box component="span" dir="ltr" sx={{ fontWeight: 500 }}>
                      {trip.vehicleModel}
                    </Box>
                    <Box component="span">•</Box>
                    <Box component="span" dir="auto">
                      {(() => {
                        const dm = trip.duration.match(/^(\d+)\s+Days?$/i);
                        if (dm) {
                          const c = Number(dm[1]);
                          return c === 1 ? t("day") : t("days", { count: c });
                        }
                        return trip.duration;
                      })()}
                    </Box>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <CalendarIcon sx={{ fontSize: 12 }} /> {trip.date}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
