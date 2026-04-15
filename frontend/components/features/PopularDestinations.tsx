"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface Destination {
  id: string;
  city: string;
  country: string;
  image: string;
  startingPrice: number;
  vehicleCount: number;
}

export default function PopularDestinations() {
  // Sample destinations - in production, fetch from API
  const destinations: Destination[] = [
    {
      id: "1",
      city: "Cairo",
      country: "Egypt",
      image: "/img/destinations/cairo.jpg",
      startingPrice: 25,
      vehicleCount: 150,
    },
    {
      id: "2",
      city: "Alexandria",
      country: "Egypt",
      image: "/img/destinations/alexandria.jpg",
      startingPrice: 30,
      vehicleCount: 85,
    },
    {
      id: "3",
      city: "Sharm El Sheikh",
      country: "Egypt",
      image: "/img/destinations/sharm.jpg",
      startingPrice: 35,
      vehicleCount: 60,
    },
    {
      id: "4",
      city: "Hurghada",
      country: "Egypt",
      image: "/img/destinations/hurghada.jpg",
      startingPrice: 32,
      vehicleCount: 45,
    },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "grey.50" }}>
      <Container maxWidth="xl">
        <Stack spacing={2} alignItems="center" mb={6}>
          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            sx={{ fontSize: { xs: "2rem", md: "3rem" } }}
          >
            Browse by Destination
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 600 }}>
            Explore our most popular rental locations with competitive rates and premium vehicles.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {destinations.map((dest) => (
            <MuiLink
              key={dest.id}
              href={`/search?pickupLocationId=${dest.id}`}
              component={Link}
              underline="none"
              sx={{
                display: "block",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    height: 200,
                    bgcolor: "grey.200",
                    overflow: "hidden",
                  }}
                >
                  {/* Placeholder for destination image */}
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      background: `linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 60, color: "white", opacity: 0.5 }} />
                  </Box>
                  
                  {/* Price badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      bgcolor: "warning.main",
                      color: "warning.contrastText",
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: "bold",
                    }}
                  >
                    <Typography variant="caption" fontWeight="bold">
                      From ${dest.startingPrice}/day
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {dest.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {dest.country}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dest.vehicleCount}+ vehicles available
                  </Typography>
                </CardContent>
              </Card>
            </MuiLink>
          ))}
        </Box>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 1.5,
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            View All Destinations
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
