"use client";

import { Box, Container, Typography } from "@mui/material";

export default function PartnerLogos() {
  // Sample partner/brand names - in production, use actual logos
  const partners = [
    "Toyota",
    "BMW",
    "Mercedes-Benz",
    "Hyundai",
    "Nissan",
    "Volkswagen",
    "Ford",
    "Chevrolet",
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "background.paper" }}>
      <Container maxWidth="xl">
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          mb={5}
          color="text.secondary"
        >
          Connecting you to the biggest brands
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(4, 1fr)",
              md: "repeat(8, 1fr)",
            },
            gap: 3,
            alignItems: "center",
          }}
        >
          {partners.map((partner, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 80,
                px: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                bgcolor: "background.paper",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                  boxShadow: 1,
                },
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                color="text.secondary"
                sx={{
                  filter: "grayscale(100%)",
                  opacity: 0.6,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  textAlign: "center",
                }}
              >
                {partner}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
