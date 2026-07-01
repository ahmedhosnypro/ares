import React from "react";
import { Paper, Box, Grid, useTheme } from "@mui/material";
import { DriverDetails } from "@/api-clients/users/users";
import { SectionLabel, FieldRow } from "../UserDetailsView";
import BadgeIcon from "@mui/icons-material/Badge";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

interface DriverInformationCardProps {
  driverDetails?: DriverDetails | null;
  t: (key: string) => string;
}

export default function DriverInformationCard({ driverDetails, t }: DriverInformationCardProps) {
  const theme = useTheme();

  if (!driverDetails) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        mb: 2.5,
      }}
    >
      <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: theme.palette.divider }}>
        <SectionLabel>{t("details.driverInformation") || "Driver Information"}</SectionLabel>

        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldRow
                icon={<BadgeIcon sx={{ fontSize: 17 }} />}
                label={t("details.licenseNumber") || "License Number"}
                value={driverDetails.licenseNumber || "—"}
                accentColor={theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FieldRow
                icon={<EventAvailableIcon sx={{ fontSize: 17 }} />}
                label={t("details.licenseExpiry") || "License Expiry"}
                value={driverDetails.licenseExpiryDate || "—"}
                accentColor={theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FieldRow
                icon={<ScheduleIcon sx={{ fontSize: 17 }} />}
                label={t("details.availability") || "Availability"}
                value={driverDetails.availability || "—"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FieldRow
                icon={<AssignmentTurnedInIcon sx={{ fontSize: 17 }} />}
                label={t("details.assignedBookings") || "Assigned Bookings"}
                value={driverDetails.assignedBookings?.toString() || "0"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FieldRow
                icon={<DirectionsCarIcon sx={{ fontSize: 17 }} />}
                label={t("details.completedTrips") || "Completed Trips"}
                value={driverDetails.completedTrips?.toString() || "0"}
                accentColor={theme.palette.secondary.main || theme.palette.primary.main}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  );
}
