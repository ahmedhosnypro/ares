import { Box, Typography } from "@mui/material";

export default function WelcomeHeader({ userName }: { readonly userName?: string }) {
  const displayName = userName || "Admin";
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.5px" }} gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Welcome back, {displayName}. Here&apos;s what&apos;s happening today.
      </Typography>
    </Box>
  );
}
