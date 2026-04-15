"use client";

import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SecurityIcon from "@mui/icons-material/Security";

export default function TrustIndicators() {
  const indicators = [
    { icon: <CancelIcon />, text: "Free Cancellation" },
    { icon: <CheckCircleIcon />, text: "No Hidden Fees" },
    { icon: <SupportAgentIcon />, text: "24/7 Support" },
    { icon: <SecurityIcon />, text: "Secure Booking" },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 8 }}>
      <Grid container spacing={2} justifyContent="center">
        {indicators.map((item, idx) => (
          <Grid size={{ xs: 6, sm: 3 }} key={idx}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: "background.paper",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ color: "success.main", display: "flex" }}>{item.icon}</Box>
              <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                {item.text}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
