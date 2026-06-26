"use client";

import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import { Box, Button, Card, CardContent, Container, Stack, Typography, Link as MuiLink } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useEffect, useState } from "react";
import { toImageUrl } from "@/utils/image-url";
import { toApiUrl } from "@/utils/api-client";
import { logger } from "@/utils/logger";

interface Destination {
  id: string;
  city: string;
  country: string;
  imageUrl?: string;
  startingPrice: number;
  vehicleCount: number;
}

interface LocationApi {
  _id: string;
  city: string;
  country?: string;
  imageUrl?: string;
}

export default function PopularDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        // Use the frontend-compatible endpoint that returns the correct format
        const apiUrl = toApiUrl("/api/locations/1/50/en");

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const data = (await response.json()) as { resultData?: LocationApi[] };

        const locations = data.resultData || [];

        // Filter locations with images and map to destinations
        const popularDestinations: Destination[] = locations
          .filter(loc => {
            const hasImage = !!loc.imageUrl;
            const hasCity = !!loc.city;
            return hasImage && hasCity;
          })
          .map(loc => ({
            id: loc._id,
            city: loc.city,
            country: loc.country || "Egypt",
            imageUrl: loc.imageUrl,
            startingPrice: 25, // Default price, could be calculated from vehicles
            vehicleCount: 50, // Default count, could be calculated from vehicles
          }))
          .slice(0, 4); // Show top 4 destinations

        setDestinations(popularDestinations);
      } catch (error) {
        logger.error("❌ Error fetching destinations:", error);
        // Fallback to empty array
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchDestinations();
  }, []);

  if (loading) {
    return (
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ alignItems: "center", mb: 6 }}>
            <Typography
              variant="h3"
              sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: "bold", textAlign: "center" }}
            >
              Browse by Destination
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, textAlign: "center" }}>
              Explore our most popular rental locations with competitive rates and premium vehicles.
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
            Loading destinations...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (destinations.length === 0) {
    return null; // Don't show the section if no destinations
  }

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "background.paper" }}>
      <Container maxWidth="xl">
        <Stack spacing={2} sx={{ alignItems: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{ fontSize: { xs: "2rem", md: "3rem" }, fontWeight: "bold", textAlign: "center" }}
          >
            Browse by Destination
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, textAlign: "center" }}>
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
          {destinations.map(dest => {
            const imageUrl = toImageUrl(dest.imageUrl);

            return (
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
                      bgcolor: "action.hover", // Theme-aware background
                      overflow: "hidden",
                    }}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`${dest.city}, ${dest.country}`}
                        fill
                        sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        style={{
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          background: theme =>
                            theme.palette.mode === "light"
                              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                              : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LocationOnIcon sx={{ fontSize: 60, color: "primary.contrastText", opacity: 0.7 }} />
                      </Box>
                    )}

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
                      <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                        From ${dest.startingPrice}/day
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                      {dest.city}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dest.country}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dest.vehicleCount}+ vehicles available
                    </Typography>
                  </CardContent>
                </Card>
              </MuiLink>
            );
          })}
        </Box>

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            href="/search"
            component={Link}
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
