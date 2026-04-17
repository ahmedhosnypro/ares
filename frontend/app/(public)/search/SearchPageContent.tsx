"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SearchFormFilter from "./SearchFormFilter";
import { formatCurrency, type PublicLocation, type PublicVehicleCard } from "@/utils/public-data";
import { toImageUrl } from "@/utils/image-url";

interface SearchPageContentProps {
  readonly locations: readonly PublicLocation[];
  readonly vehicles: readonly PublicVehicleCard[];
  readonly pickupLocationId: string;
  readonly pickupDate: string;
  readonly returnDate: string;
  readonly selectedLocation: PublicLocation | undefined;
}

function VehicleCard({ vehicle }: Readonly<{ vehicle: PublicVehicleCard }>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const theme = useTheme();
  const imageUrl = toImageUrl(vehicle.imageUrl);

  return (
    <Box>
      <Link href={`/vehicles/${vehicle.vehicleId}`} style={{ textDecoration: "none", color: "inherit" }}>
        <Card
          sx={{
            height: "100%",
            borderRadius: "24px",
            boxShadow: theme.palette.shadow.card,
            border: `1px solid ${theme.palette.border.light}`,
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: theme.palette.shadow.cardHover,
              "& .view-details": {
                color: theme.palette.primary.dark,
                transform: "translateX(4px)",
              },
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              aspectRatio: "16/9",
              bgcolor: "grey.50",
              overflow: "hidden",
              // Consistent background for all images
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            {imageUrl ? (
              <>
                {!imageLoaded && (
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{ position: "absolute", top: 0, left: 0 }}
                  />
                )}
                <Image
                  src={imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    opacity: imageLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease-in-out",
                  }}
                  loading="lazy"
                  onLoad={() => {
                    setImageLoaded(true);
                  }}
                />
              </>
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
                fontWeight: 600,
                fontSize: { xs: "0.75rem", md: "0.75rem" },
                borderRadius: "999px",
                boxShadow: `0 4px 12px ${theme.palette.secondary.main}4D`,
              }}
            />
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: "1.125rem", md: "1.25rem" } }}>
                  {vehicle.make} {vehicle.model}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.875rem", md: "0.875rem" },
                    fontWeight: 500,
                  }}
                >
                  {vehicle.locationCity || "Available location"}
                </Typography>
              </Box>

              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.75rem", md: "0.75rem" },
                      fontWeight: 500,
                    }}
                  >
                    From
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={900}
                    color="primary.main"
                    sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
                  >
                    {formatCurrency(vehicle.dailyRate, vehicle.currency)}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={0.5}>
                  <Rating value={vehicle.rating} precision={0.1} readOnly size="small" />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: "0.75rem", md: "0.75rem" },
                    }}
                  >
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.875rem", md: "0.875rem" },
                      fontWeight: 500,
                    }}
                  >
                    {vehicle.locationCity || "Demo city"}
                  </Typography>
                </Stack>
                <Box
                  component="span"
                  className="view-details"
                  sx={{
                    minHeight: "44px", // Ensure minimum touch target
                    minWidth: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                    py: 1,
                    borderRadius: "8px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: "primary.50",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="primary.main"
                    sx={{
                      fontSize: { xs: "0.875rem", md: "0.875rem" },
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    View details →
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Link>
    </Box>
  );
}

function SearchResults({ vehicles }: Readonly<{ vehicles: readonly PublicVehicleCard[] }>) {
  const theme = useTheme();

  if (vehicles.length === 0) {
    return (
      <Paper
        sx={{
          p: { xs: 4, md: 7 },
          textAlign: "center",
          borderRadius: "24px",
          boxShadow: theme.palette.shadow.card,
          border: `1px solid ${theme.palette.border.main}`,
          bgcolor: "background.paper",
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
              boxShadow: theme.palette.shadow.button,
              "&:hover": {
                boxShadow: theme.palette.shadow.buttonHover,
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
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(3, minmax(0, 1fr))",
        },
        // Handle orphaned cards on tablet view
        "& > :last-child:nth-child(odd)": {
          "@media (min-width: 900px) and (max-width: 1535px)": {
            gridColumn: "span 2",
            maxWidth: "calc(50% - 12px)",
            justifySelf: "center",
          },
        },
      }}
    >
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.vehicleId} vehicle={vehicle} />
      ))}
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
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        pb: 8,
        background: theme.palette.overlay.gradient,
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: theme.palette.border.main,
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          py: { xs: 3, lg: 4 }, // Much smaller vertical padding
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3} alignItems="center">
            {/* Compact hero - properly responsive title */}
            <Box textAlign="center">
              <Typography
                variant="h3"
                sx={{
                  fontSize: {
                    xs: "1.5rem", // 24px on mobile
                    sm: "1.75rem", // 28px on small tablets
                    md: "2rem", // 32px on tablets
                    lg: "2.25rem", // 36px on desktop
                    xl: "2.5rem", // 40px on large desktop
                  },
                  fontWeight: 800,
                  mb: 1,
                  lineHeight: { xs: 1.3, md: 1.2 },
                }}
              >
                Find the perfect car for your trip
              </Typography>
            </Box>

            {/* Compact search form - single row on desktop */}
            <Box sx={{ width: "100%", maxWidth: "1000px" }}>
              <SearchFormFilter
                locations={locations}
                defaultLocationId={pickupLocationId}
                defaultPickupDate={pickupDate}
                defaultReturnDate={returnDate}
              />
            </Box>

            {/* Compact search tags */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<MapRoundedIcon />}
                label={selectedLocation?.label || "Select location"}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontSize: "0.75rem" }}
              />
              <Chip
                icon={<CalendarMonthRoundedIcon />}
                label={`${pickupDate} → ${returnDate}`}
                color="secondary"
                variant="outlined"
                size="small"
                sx={{ fontSize: "0.75rem" }}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Results section */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, lg: 6 } }}>
        <SearchResults vehicles={vehicles} />
      </Container>
    </Box>
  );
}
