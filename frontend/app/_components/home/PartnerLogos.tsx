"use client";

import { Box, Container, Typography } from "@mui/material";
import type { PublicSupplierCard } from "@/utils/public-data";

interface PartnerLogosProps {
  readonly suppliers?: readonly PublicSupplierCard[];
}

export default function PartnerLogos({ suppliers = [] }: Readonly<PartnerLogosProps>) {
  // Sample partner/brand names - in production, use actual logos
  const fallbackPartners = ["Toyota", "BMW", "Mercedes-Benz", "Hyundai", "Nissan", "Volkswagen", "Ford", "Chevrolet"];
  const partners = suppliers
    .map(supplier => supplier.companyName.trim())
    .filter(Boolean)
    .slice(0, 8);
  const displayPartners = partners.length > 0 ? partners : fallbackPartners;

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: "background.paper",
        borderRadius: 3,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", textAlign: "center", mb: 4 }}>
            {partners.length > 0 ? "Trusted rental partners" : "Connecting you to the biggest brands"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            {displayPartners.map((partner, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: "calc(50% - 8px)", sm: 160 },
                  maxWidth: 180,
                  height: 80,
                  px: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
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
                  sx={{
                    fontWeight: "bold",
                    filter: "grayscale(100%)",
                    opacity: 0.9,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    textAlign: "center",
                  }}
                >
                  {partner}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
