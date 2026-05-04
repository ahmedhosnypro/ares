"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Button,
  Avatar,
  IconButton,
  Grid,
  alpha,
  useTheme,
  Container,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DirectionsCarFilledIcon from "@mui/icons-material/DirectionsCarFilled";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SpeedIcon from "@mui/icons-material/Speed"; // بدلاً من Settings للمسة عصرية
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import PaidIcon from "@mui/icons-material/Paid";

import { getCarById, Vehicle } from "@/api-clients/cars/cars";
import { logger } from "@/utils/logger";

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { data: session } = useSession();

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [car, setCar] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !session?.accessToken) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        const carData = await getCarById(session.accessToken, id);
        setCar(carData);
      } catch (err) {
        logger.error("Failed to load car", err);
        setCar(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchCar();
  }, [id, session?.accessToken]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress thickness={5} size={50} sx={{ borderRadius: "50%" }} />
      </Box>
    );
  }

  if (!car) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.secondary" }}>
          Vehicle Not Found
        </Typography>
        <Button
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => {
            router.back();
          }}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return theme.palette.success.main;
      case "rented":
        return theme.palette.warning.main;
      case "maintenance":
        return theme.palette.error.main;
      default:
        return theme.palette.text.disabled;
    }
  };

  return (
    <Box
      sx={{
        bgcolor: alpha(theme.palette.background.default, 0.5),
        minHeight: "100vh",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        {/* Top Header / Navigation */}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <IconButton
            onClick={() => {
              router.back();
            }}
            sx={{
              bgcolor: "background.paper",
              boxShadow: "shadow.card",
              "&:hover": { bgcolor: "background.paper", transform: "translateX(-3px)" },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Button
            variant="contained"
            disableElevation
            startIcon={<EditIcon />}
            onClick={() => {
              router.push(`/admin/cars/${id}/edit`);
            }}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              px: 4,
              py: 1.2,
              fontWeight: 700,
              fontSize: "0.95rem",
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Edit Details
          </Button>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "32px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "border.light",
            boxShadow: "shadow.card",
          }}
        >
          {/* Visual Header Section */}
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              background: `linear-gradient(to bottom right, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`,
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={4} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "background.paper",
                  boxShadow: "shadow.card",
                  color: "primary.main",
                }}
              >
                <DirectionsCarFilledIcon sx={{ fontSize: 50 }} />
              </Avatar>

              <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
                  {car.make}{" "}
                  <Box component="span" sx={{ color: "primary.main" }}>
                    {car.model}
                  </Box>
                </Typography>

                <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: "center", sm: "flex-start" } }}>
                  <Chip
                    label={car.year}
                    sx={{ fontWeight: 800, borderRadius: "8px", bgcolor: alpha(theme.palette.text.primary, 0.05) }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 0.5,
                      borderRadius: "8px",
                      bgcolor: alpha(getStatusColor(car.availabilityStatus), 0.1),
                      color: getStatusColor(car.availabilityStatus),
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "currentColor" }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
                      {car.availabilityStatus}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: "dashed" }} />

          {/* Details Content */}
          <Box sx={{ p: { xs: 4, md: 6 } }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoCard
                  icon={<PaidIcon />}
                  label="Daily Pricing"
                  value={`$${String(car.pricePerDay)}`}
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoCard
                  icon={<LocationOnIcon />}
                  label="Available At"
                  value={car.locationCity}
                  color={theme.palette.error.main}
                />
              </Grid>

              {/* Grid Mini Stats */}
              {[
                { icon: <SpeedIcon />, label: "Transmission", value: car.transmission },
                { icon: <LocalGasStationIcon />, label: "Fuel Type", value: car.fuelType },
                { icon: <EventSeatIcon />, label: "Capacity", value: `${String(car.seats)} Seats` },
                { icon: <DirectionsCarFilledIcon />, label: "Plate ID", value: car.licensePlate },
              ].map((item, idx) => (
                <Grid size={{ xs: 6, md: 3 }} key={idx}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: "20px",
                      bgcolor: alpha(theme.palette.action.hover, 0.3),
                      textAlign: "center",
                      border: "1px solid transparent",
                      transition: "0.3s",
                      "&:hover": { border: "1px solid", borderColor: "border.light", bgcolor: "background.paper" },
                    }}
                  >
                    <Box sx={{ color: "text.secondary", mb: 1 }}>{item.icon}</Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Description Section */}
            <Box sx={{ mt: 6 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                About this Vehicle
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  lineHeight: 1.8,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  p: 3,
                  borderRadius: "20px",
                  border: `1px left solid ${theme.palette.primary.main}`,
                }}
              >
                {car.description ||
                  "The owner hasn't provided a detailed description yet, but this vehicle has passed all our quality checks."}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

interface InfoCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly color: string;
}

/* Modern Info Card Component */
function InfoCard({ icon, label, value, color }: InfoCardProps) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        gap: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "border.light",
        boxShadow: "shadow.card",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: "16px",
          bgcolor: alpha(color, 0.1),
          color: color,
          display: "flex",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
