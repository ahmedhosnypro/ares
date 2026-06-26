"use client";

import {
  Card,
  Box,
  Typography,
  CardContent,
  Grid,
  Stack,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  DirectionsCar as CarIcon,
  QueryBuilder as DurationIcon,
  LocationOn as LocationIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

interface TripAssignment {
  readonly clientName: string;
  readonly clientAvatar: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly vehicleModel: string;
  readonly vehiclePlate: string;
  readonly vehicleColor: string;
  readonly vehicleImage: string;
  readonly pickupDate: string;
  readonly dropoffDate: string;
  readonly pickupLocation: string;
  readonly dropoffLocation: string;
  readonly rentalDuration: string;
}

interface ActiveAssignmentCardProps {
  readonly assignment: TripAssignment | null;
}

export default function ActiveAssignmentCard({ assignment }: ActiveAssignmentCardProps) {
  // Empty state — no active assignment
  if (!assignment) {
    return (
      <Card
        sx={{
          borderRadius: 4,
          p: 2,
          border: "1px solid",
          borderColor: "border.light",
          bgcolor: "background.paper",
          boxShadow: theme => theme.palette.shadow.card,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid",
            borderColor: "border.light",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "overlay.blur",
            backdropFilter: "blur(10px)",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar sx={{ bgcolor: "action.disabledBackground", width: 32, height: 32 }}>
              <CarIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              Active Rental Assignment
            </Typography>
          </Stack>
          <Chip label="No Assignment" size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
        </Box>
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 8,
          }}
        >
          <CarIcon sx={{ fontSize: 64, color: "text.disabled", opacity: 0.3 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: "text.secondary" }}>
            No active assignment
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", maxWidth: 280 }}>
            You have no ongoing trip at the moment. Check your upcoming schedule for future assignments.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 2,
        border: "2px solid",
        borderColor: "primary.main",
        bgcolor: "background.paper",
        boxShadow: theme => theme.palette.shadow.cardHover,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Premium Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid",
          borderColor: "border.light",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "overlay.blur",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32 }}>
            <CarIcon fontSize="small" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
            Active Rental Assignment
          </Typography>
        </Stack>
        <Chip label="In Progress" color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
      </Box>

      <CardContent sx={{ p: { xs: 3, md: 4 }, flexGrow: 1, display: "flex", flexDirection: "column", gap: 3.5 }}>
        {/* Section 1: Assigned Client (Full Width at Top) */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", mb: 1.5 }}
          >
            Assigned Client
          </Typography>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "border.light",
              bgcolor: "background.default",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
                <Avatar
                  src={assignment.clientAvatar}
                  sx={{
                    width: 56,
                    height: 56,
                    border: "2px solid",
                    borderColor: "primary.main",
                  }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                    {assignment.clientName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", fontWeight: 500, mt: 0.25 }}
                  >
                    {assignment.clientEmail} • {assignment.clientPhone}
                  </Typography>
                  <Chip
                    label="Premium Customer"
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      borderRadius: 1.5,
                      fontSize: "0.7rem",
                      height: 20,
                    }}
                  />
                </Box>
              </Stack>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mt: { xs: 2, sm: 0 }, alignSelf: { xs: "stretch", sm: "auto" }, justifyContent: "center" }}
              >
                <Tooltip title="Call Client">
                  <IconButton
                    href={`tel:${assignment.clientPhone}`}
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      width: 42,
                      height: 42,
                    }}
                  >
                    <PhoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="WhatsApp Client">
                  <IconButton
                    href={`https://wa.me/${assignment.clientPhone.replace("+", "")}`}
                    target="_blank"
                    sx={{
                      bgcolor: "success.main",
                      color: "common.white",
                      "&:hover": {
                        bgcolor: "success.dark",
                      },
                      width: 42,
                      height: 42,
                    }}
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Card>
        </Box>

        <Divider />

        {/* Section 2: Journey Path (Side-by-Side Grid) */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", mb: 2 }}
          >
            Journey Path
          </Typography>
          <Grid container spacing={3}>
            {/* Pickup Address Item */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "border.light",
                  bgcolor: "background.default",
                  display: "flex",
                  gap: 2.5,
                  alignItems: "flex-start",
                  height: "100%",
                }}
              >
                <Avatar sx={{ bgcolor: "success.main", color: "common.white", width: 42, height: 42 }}>
                  <LocationIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Pickup address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary", mt: 0.5 }}>
                    {assignment.pickupLocation}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5, fontWeight: 500 }}
                  >
                    Scheduled: {assignment.pickupDate}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Drop-off Destination Item */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "border.light",
                  bgcolor: "background.default",
                  display: "flex",
                  gap: 2.5,
                  alignItems: "flex-start",
                  height: "100%",
                }}
              >
                <Avatar sx={{ bgcolor: "error.main", color: "common.white", width: 42, height: 42 }}>
                  <FlagIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Drop-off destination
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary", mt: 0.5 }}>
                    {assignment.dropoffLocation}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5, fontWeight: 500 }}
                  >
                    Scheduled: {assignment.dropoffDate}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Section 3 & 4: Vehicle Specs & Guidelines (Side-by-Side Grid) */}
        <Grid container spacing={3}>
          {/* Left: Vehicle Specs */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", mb: 1.5 }}
            >
              Assigned Fleet Vehicle
            </Typography>
            <Card
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "border.light",
                bgcolor: "background.default",
                position: "relative",
                overflow: "hidden",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <CarIcon
                sx={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  fontSize: 120,
                  opacity: 0.04,
                  color: "text.primary",
                }}
              />

              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 44, height: 44 }}>
                    <CarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {assignment.vehicleModel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 500 }}>
                      Luxury Sedan Class
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Chip
                    label={assignment.vehicleColor}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "border.light",
                    }}
                  />
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      bgcolor: "background.paper",
                      px: 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "text.primary",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        letterSpacing: "1px",
                        color: "text.primary",
                      }}
                    >
                      {assignment.vehiclePlate}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Grid>

          {/* Right: Guidelines */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", mb: 1.5 }}
            >
              Rental Schedule & Guidelines
            </Typography>
            <Card
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "border.light",
                bgcolor: "background.default",
                flexGrow: 1,
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Active Duration
                  </Typography>
                  <Chip
                    icon={<DurationIcon />}
                    label={assignment.rentalDuration}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                </Box>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Ensure vehicle cabin remains clean and client amenities are stocked.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Verify route schedule and adjust for traffic before picking up client.
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Report any delays or telemetry issues immediately via dispatch.
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
