"use client";

import { useEffect, useState } from "react";
import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import { Box, Container, Grid, Typography, CircularProgress, Card, Link as MuiLink, Stack } from "@mui/material";
import ElectricCarIcon from "@mui/icons-material/ElectricCar";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import StarIcon from "@mui/icons-material/Star";
import WorkIcon from "@mui/icons-material/Work";
import GroupsIcon from "@mui/icons-material/Groups";
import { fetchPublicCategories, type PublicCategory } from "@/utils/public-data";
import React from "react";
import { logger } from "@/utils/logger";

// Pre-defined premium descriptions, images, and icons for fallback & style enhancement
const categoryDetails: Record<string, { image: string; description: string; icon: React.ReactElement } | undefined> = {
  suv: {
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    description: "Spacious and powerful, built to handle any terrain or family road trip with maximum comfort.",
    icon: <GroupsIcon />,
  },
  sedan: {
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800",
    description: "Classic styling, excellent fuel efficiency, and a smooth, comfortable ride for daily commutes.",
    icon: <DirectionsCarIcon />,
  },
  luxury: {
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800",
    description: "Premium class vehicles combining cutting-edge technology, elite comfort, and prestige performance.",
    icon: <StarIcon />,
  },
  electric: {
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800",
    description: "Zero emission vehicles featuring silent drives, instant torque, and futuristic technology.",
    icon: <ElectricCarIcon />,
  },
  sports: {
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    description: "High-performance cars designed for speed, precise handling, and pure driving excitement.",
    icon: <SpeedIcon />,
  },
  business: {
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800",
    description: "Refined and professional vehicles, ideal for executive travel, meetings, and business trips.",
    icon: <WorkIcon />,
  },
};

const defaultIcon = <DirectionsCarIcon />;
const defaultImage = "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800";
const defaultDescription = "Quality rental vehicles designed to fit your journey and exceed your expectations.";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Vehicle Categories | Ares Car Rental";

    async function loadCategories() {
      try {
        const data = await fetchPublicCategories();

        // If API returns categories, use them. Otherwise, fall back to default list
        if (data.length > 0) {
          setCategories(data);
        } else {
          // Fallback static list matching our premium items
          setCategories([
            { id: "1", name: "SUV", vehicleCount: 15 },
            { id: "2", name: "Sedan", vehicleCount: 22 },
            { id: "3", name: "Luxury", vehicleCount: 8 },
            { id: "4", name: "Electric", vehicleCount: 12 },
            { id: "5", name: "Sports", vehicleCount: 6 },
            { id: "6", name: "Business", vehicleCount: 10 },
          ]);
        }
      } catch (err) {
        logger.error("Failed to load categories", err);
        // Fallback on error
        setCategories([
          { id: "1", name: "SUV", vehicleCount: 15 },
          { id: "2", name: "Sedan", vehicleCount: 22 },
          { id: "3", name: "Luxury", vehicleCount: 8 },
          { id: "4", name: "Electric", vehicleCount: 12 },
          { id: "5", name: "Sports", vehicleCount: 6 },
          { id: "6", name: "Business", vehicleCount: 10 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    void loadCategories();
  }, []);

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, minHeight: "80vh", bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        {/* Header section */}
        <Stack spacing={2} sx={{ alignItems: "center", mb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: "bold",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Browse by Vehicle Type
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 600,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Explore our diverse fleet catalog. Select a category below to filter vehicles and find the perfect match for
            your road.
          </Typography>
        </Stack>

        {/* Loading Spinner */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress color="primary" size={50} />
          </Box>
        ) : (
          /* Categories Grid */
          <Grid container spacing={4}>
            {categories.map(cat => {
              const nameLower = cat.name.toLowerCase();

              // Get premium enhancements based on category name, or use default fallbacks
              const details = categoryDetails[nameLower] || {
                image: defaultImage,
                description: defaultDescription,
                icon: defaultIcon,
              };

              return (
                <Grid key={cat.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <MuiLink
                    href={`/search?category=${cat.id}`}
                    component={Link}
                    underline="none"
                    sx={{
                      display: "block",
                      height: "100%",
                    }}
                  >
                    <Card
                      sx={{
                        position: "relative",
                        height: 380,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "border.light",
                        boxShadow: theme => theme.palette.shadow.card,
                        "&:hover": {
                          boxShadow: theme => theme.palette.shadow.cardHover,
                          transform: "translateY(-8px)",
                          "& img": {
                            transform: "scale(1.08)",
                          },
                        },
                        transition: "all 0.3s ease-in-out",
                      }}
                    >
                      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                        {/* Background Image */}
                        <Image
                          src={details.image}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{
                            objectFit: "cover",
                            objectPosition: "center",
                            transition: "transform 0.5s ease",
                          }}
                        />

                        {/* Premium Dark Gradient Overlay */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(to top, rgba(16, 33, 43, 0.95) 0%, rgba(16, 33, 43, 0.6) 45%, rgba(16, 33, 43, 0.15) 100%)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "end",
                            p: 3.5,
                          }}
                        >
                          {/* Icon Badge */}
                          <Box
                            sx={{
                              alignSelf: "start",
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 2,
                              boxShadow: theme => theme.palette.shadow.button,
                            }}
                          >
                            {details.icon}
                          </Box>

                          {/* Category Name */}
                          <Typography variant="h5" sx={{ fontWeight: 800, color: "common.white", mb: 1 }}>
                            {cat.name}
                          </Typography>

                          {/* Category Description */}
                          <Typography
                            variant="body2"
                            sx={{
                              color: "common.white",
                              opacity: 0.8,
                              mb: 3,
                              lineHeight: 1.4,
                              fontSize: "0.9rem",
                            }}
                          >
                            {details.description}
                          </Typography>

                          {/* Bottom info strip */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderTop: "1px solid",
                              borderColor: "rgba(255, 255, 255, 0.15)",
                              pt: 2,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "common.white", opacity: 0.6, fontWeight: 600 }}>
                              {cat.vehicleCount ?? 0} Vehicles Available
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "primary.light",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              Explore Now →
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </MuiLink>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
