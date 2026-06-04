import { Box, Typography } from "@mui/material";

export default function WelcomeHeader({ userName }: { userName?: string }) {
  const displayName = userName || "Admin";
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom sx={{ color: "text.primary", letterSpacing: "-0.5px" }}>
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Welcome back, {displayName}. Here's what's happening today.
      </Typography>
    </Box>
  );
}