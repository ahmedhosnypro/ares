"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SearchFormFilter from "./SearchFormFilter";
import { formatCurrency, type PublicLocation, type PublicVehicleCard } from "@/src/utils/public-data";
import { toImageUrl } from "@/src/utils/image-url";

interface SearchPageContentProps {
  readonly locations: readonly PublicLocation[];
  readonly vehicles: readonly PublicVehicleCard[];
  readonly pickupLocationId: string;
  readonly pickupDate: string;
  readonly returnDate: string;
  readonly selectedLocation: PublicLocation | undefined;
}

function SearchResults({ vehicles }: Readonly<{ vehicles: readonly PublicVehicleCard[] }>) {
  if (vehicles.length === 0) {
    return (
      <Paper 
        sx={{ 
          p: { xs: 4, md: 7 }, 
          textAlign: "center",
          borderRadius: "24px",
          boxShadow: "0 24px 60px rgba(15, 91, 91, 0.12)",
          border: "1px solid rgba(15, 91, 91, 0.1)",
          bgcolor: "#ffffff",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <SearchRoundedIcon color="primary" sx={{ fontSize: 44 }} />
          <Typography variant="h5" fontWeight={800}>
            No cars matched that search
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try another location or stretch the dates a bit wider.
          </Typography>
          <Button 
            href="/" 
            variant="contained" 
            color="primary"
            sx={{
              borderRadius: "999px",
              boxShadow: "0 8px 16px rgba(15, 91, 91, 0.3)",
              "&:hover": {
                boxShadow: "0 12px 20px rgba(15, 91, 91, 0.4)",
              },
            }}
          >
            Back to landing page
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
      }}
    >
      {vehicles.map(vehicle => {
        const imageUrl = toImageUrl(vehicle.imageUrl);

        return (
          <Box key={vehicle.vehicleId}>
            <Link href={`/vehicles/${vehicle.vehicleId}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card 
                sx={{ 
                  height: "100%",
                  borderRadius: "24px",
                  boxShadow: "0 24px 60px rgba(15, 91, 91, 0.12)",
                  border: "1px solid rgba(15, 91, 91, 0.08)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 32px 80px rgba(15, 91, 91, 0.18)",
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: "relative", 
                    height: 240, 
                    bgcolor: "grey.50",
                    overflow: "hidden",
                  }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      sizes="(max-width: 1536px) 100vw, 33vw"
                      style={{ 
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                    />
                  ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", color: "text.secondary" }}>
                      <StarRoundedIcon fontSize="large" />
                      <Typography variant="caption">No image yet</Typography>
                    </Stack>
                  )}
                  <Chip
                    label={vehicle.available ? "Available now" : vehicle.status || "Check availability"}
                    color="secondary"
                    sx={{ 
                      position: "absolute", 
                      left: 16, 
                      top: 16, 
                      fontWeight: 700,
                      borderRadius: "999px",
                      boxShadow: "0 4px 12px rgba(184, 134, 11, 0.3)",
                    }}
                  />
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>
                        {vehicle.make} {vehicle.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.locationCity || "Available location"}
                      </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          From
                        </Typography>
                        <Typography variant="h5" fontWeight={900} color="primary.main">
                          {formatCurrency(vehicle.dailyRate, vehicle.currency)}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Rating value={vehicle.rating} precision={0.1} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.reviewCount} reviews
                        </Typography>
                      </Stack>
                    </Stack>

                    <Divider />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, bgcolor: "primary.main" }}>
                          <MapRoundedIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.locationCity || "Demo city"}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        View details →
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Link>
          </Box>
        );
      })}
    </Box>
  );
}

export default function SearchPageContent({
  locations,
  vehicles,
  pickupLocationId,
  pickupDate,
  returnDate,
  selectedLocation,
}: SearchPageContentProps) {
  return (
    <Box 
      component="main" 
      sx={{ 
        minHeight: "100vh", 
        pb: 8,
        background: "linear-gradient(135deg, #f4f6f8 0%, rgba(15, 91, 91, 0.05) 100%)",
      }}
    >
      <Box 
        sx={{ 
          borderBottom: "1px solid", 
          borderColor: "rgba(15, 91, 91, 0.1)", 
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "text.secondary" }}>
                Search
              </Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: "2.4rem", md: "3.5rem" }, fontWeight: 900 }}>
                Find a car that fits the trip, not just the form.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760, mt: 1.5, lineHeight: 1.7 }}>
                Browse our extensive inventory with live availability, ratings, and detailed vehicle information.
              </Typography>
            </Box>

            <SearchFormFilter
              locations={locations}
              defaultLocationId={pickupLocationId}
              defaultPickupDate={pickupDate}
              defaultReturnDate={returnDate}
            />

            <Stack direction="row" spacing={1.25} flexWrap="wrap">
              <Chip
                icon={<MapRoundedIcon />}
                label={selectedLocation?.label || "Select location"}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<CalendarMonthRoundedIcon />}
                label={`${pickupDate} → ${returnDate}`}
                color="secondary"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <SearchResults vehicles={vehicles} />
      </Container>
    </Box>
  );
}
