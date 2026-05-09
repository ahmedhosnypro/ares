"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  EditRounded as EditIcon,
  DirectionsCarFilledTwoTone as CarIcon,
  EventSeat as EventSeatIcon,
  LocalGasStation as FuelIcon,
  LocationOn as LocationIcon,
  Paid as PaidIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  getSupplierVehicleById,
  isRejectedStatus,
  type SupplierVehicleDetails,
} from "@/api-clients/supplier-vehicles/supplier-vehicles";
import { toImageUrl } from "@/utils/image-url";
import { logger } from "@/utils/logger";
import { AvailabilityChip, StatusChip } from "../_components/StatusChips";

export default function SupplierVehicleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const { data: session, status: sessionStatus } = useSession();

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [vehicle, setVehicle] = useState<SupplierVehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!id) return;
    if (!session?.accessToken) {
      setLoading(false);
      setError("You must be signed in to view this vehicle.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSupplierVehicleById(session.accessToken, id)
      .then(data => {
        if (cancelled) return;
        setVehicle(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error("Failed to load vehicle details", err);
        setVehicle(null);
        setError(
          err instanceof Error && err.message.toLowerCase().includes("not found")
            ? "Vehicle not found, or you don't have permission to view it."
            : "Could not load vehicle details. Please try again shortly.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, session?.accessToken, sessionStatus]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
          <Tooltip title="Back to vehicles">
            <IconButton
              onClick={() => {
                router.push("/supplier/vehicles");
              }}
              sx={{ borderRadius: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Vehicle details
          </Typography>
        </Stack>
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
          {error ?? "Vehicle not found."}
        </Alert>
      </Box>
    );
  }

  const formattedDate = (() => {
    const d = new Date(vehicle.createdAt);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  })();

  const rejected = isRejectedStatus(vehicle.status);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: 2, alignItems: { xs: "flex-start", sm: "center" }, mb: 3, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Tooltip title="Back to vehicles">
            <IconButton
              onClick={() => {
                router.push("/supplier/vehicles");
              }}
              sx={{ borderRadius: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}>
              {vehicle.make} {vehicle.model}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {vehicle.year ? `${String(vehicle.year)} · ` : ""}
              Plate {vehicle.licensePlate || "—"}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => {
            router.push(`/supplier/vehicles/${vehicle.vehicleId}/edit`);
          }}
          disabled={vehicle.isReadOnly}
          sx={{
            borderRadius: 3,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            background: t => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
          }}
        >
          {vehicle.isReadOnly ? "Read-only" : "Edit vehicle"}
        </Button>
      </Stack>

      {rejected && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          This vehicle was rejected by an admin. It is read-only and cannot be edited or made available.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left: image + status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {vehicle.imageUrl ? (
                <Image
                  src={(toImageUrl(vehicle.imageUrl) as string) || vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 40vw"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                  }}
                >
                  <CarIcon sx={{ fontSize: 48 }} />
                </Avatar>
              )}
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                <StatusChip status={vehicle.status} />
                <AvailabilityChip availability={vehicle.availabilityStatus} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                Listed on {formattedDate} · {vehicle.bookingsCount} booking{vehicle.bookingsCount === 1 ? "" : "s"}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Right: details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
              Vehicle information
            </Typography>

            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <DetailRow icon={<PaidIcon />} label="Price per day" value={`$${vehicle.pricePerDay.toLocaleString()}`} />
              <DetailRow icon={<SpeedIcon />} label="Transmission" value={vehicle.transmission || "—"} />
              <DetailRow icon={<FuelIcon />} label="Fuel type" value={vehicle.fuelType || "—"} />
              <DetailRow icon={<EventSeatIcon />} label="Seats" value={vehicle.seats != null ? String(vehicle.seats) : "—"} />
              <DetailRow icon={<LocationIcon />} label="Location" value={vehicle.locationCity || "—"} />
              <DetailRow icon={<CarIcon />} label="Color" value={vehicle.color || "—"} />
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em" }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }} color={vehicle.description ? "text.primary" : "text.secondary"}>
              {vehicle.description || "No description provided."}
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Small presentation helper, kept local since the details grid is the only
// place using it. ──────────────────────────────────────────────────────────────
function DetailRow({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: t => alpha(t.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );
}
