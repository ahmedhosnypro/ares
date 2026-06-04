// app/admin/components/QuickActions.tsx
"use client";

import { Card, CardContent, Typography, Grid, Button, useTheme } from "@mui/material";
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
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: "white",
        mb: 3,
        mt:3,
      }}
    >
      <CardContent sx={{ p: 4, mb: 2 }}>
        <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: "white" }}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {actions.map((action) => (
            <Grid key={action.label} size={{ xs: 6 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={action.icon}
                onClick={() => router.push(action.path)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
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