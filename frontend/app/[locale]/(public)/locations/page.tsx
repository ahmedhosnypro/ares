"use client";

import { useEffect, useState } from "react";
import { Link } from "@/shared/i18n/routing";
import Image from "next/image";
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Pagination,
  Card,
  CardContent,
  Link as MuiLink,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useLocations } from "@/api-clients/locations/locations";
import { toImageUrl } from "@/utils/image-url";

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { locations, loading, page, totalPages, setPage, setSearch } = useLocations();

  // Debounce search input to avoid spamming the API on every keypress
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 300); // 300ms delay

    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [searchTerm, setSearch, setPage]);

  // Page title metadata on client-side
  useEffect(() => {
    document.title = "Explore Locations | Ares Car Rental";
  }, []);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, minHeight: "80vh", bgcolor: "background.default" }}>
      <Container maxWidth="xl">
        {/* Header section */}
        <Stack spacing={2} sx={{ alignItems: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: "bold",
              textAlign: "center",
              color: "text.primary",
            }}
          >
            Our Locations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 600,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Browse all our pickup and drop-off locations to find the perfect starting point for your next trip.
          </Typography>
        </Stack>

        {/* Search Bar */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 8 }}>
          <TextField
            fullWidth
            placeholder="Search locations by name..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
            }}
            sx={{
              maxWidth: 600,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "background.paper",
                boxShadow: theme => theme.palette.shadow.card,
                "&:hover": {
                  boxShadow: theme => theme.palette.shadow.cardHover,
                },
                transition: "all 0.2s ease",
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Loading Spinner */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress color="primary" size={50} />
          </Box>
        ) : locations.length === 0 ? (
          /* Empty State */
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
              No locations found matching your search.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Try checking your spelling or search for another city.
            </Typography>
          </Box>
        ) : (
          /* Locations Grid */
          <>
            <Grid container spacing={3}>
              {locations.map(loc => {
                // Map API properties safely to match the Home Page card expectation
                const id = (loc.id as string | undefined) || (loc._id as string | undefined) || "";
                const city = loc.city || loc.name || "Location";
                const country = loc.country || "Egypt";
                const rawImage =
                  typeof loc.imageUrl === "string"
                    ? loc.imageUrl
                    : typeof loc.image === "string"
                      ? loc.image
                      : undefined;
                const imageUrl = toImageUrl(rawImage);
                const startingPrice = 25; // Reused static mock price from home page card
                const vehicleCount = 50; // Reused static mock count from home page card

                return (
                  <Grid key={id} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <MuiLink
                      href={`/search?pickupLocationId=${id}`}
                      component={Link}
                      underline="none"
                      sx={{
                        display: "block",
                        height: "100%",
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
                          borderColor: "border.light",
                          boxShadow: theme => theme.palette.shadow.card,
                          "&:hover": {
                            boxShadow: theme => theme.palette.shadow.cardHover,
                            borderColor: "border.main",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            height: 200,
                            bgcolor: "background.paper",
                            overflow: "hidden",
                          }}
                        >
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={`${city}, ${country}`}
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
                              From ${startingPrice}/day
                            </Typography>
                          </Box>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5, color: "text.primary" }}>
                            {city}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                            {country}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {vehicleCount}+ vehicles available
                          </Typography>
                        </CardContent>
                      </Card>
                    </MuiLink>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
