// app/admin/components/QuickActions.tsx
"use client";

import { Card, CardContent, Typography, Grid, Button } from "@mui/material";
import AddCarIcon from "@mui/icons-material/AddRoad";
import AddBookingIcon from "@mui/icons-material/EventAvailable";
import AddUserIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";

const actions = [
  { label: "Add Vehicle", icon: <AddCarIcon />, path: "/admin/cars/create", color: "primary" },
  { label: "New Booking", icon: <AddBookingIcon />, path: "/admin/bookings/create", color: "success" },
  { label: "Add User", icon: <AddUserIcon />, path: "/admin/users/create", color: "warning" },
  { label: "Settings", icon: <SettingsIcon />, path: "/admin/settings", color: "info" },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <Card
      elevation={0}
      sx={theme => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: "border.main",
        height: "100%",
        background: theme.palette.overlay.tealGradient,
        color: "common.white",
        mb: 3,
        mt: 3,
      })}
    >
      <CardContent sx={{ p: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "common.white" }} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {actions.map(action => (
            <Grid key={action.label} size={{ xs: 6 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={action.icon}
                onClick={() => {
                  router.push(action.path);
                }}
                sx={{
                  bgcolor: "header.buttonHover",
                  backdropFilter: "blur(10px)",
                  color: "common.white",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "header.avatarBorder" },
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
