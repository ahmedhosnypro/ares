import Link from "next/link";
import Image from "next/image";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { toImageUrl } from "@/utils/image-url";

export interface BookingItem {
  readonly id?: string;
  readonly car?: { readonly id?: string; readonly name?: string; readonly image?: string };
  readonly supplier?: { readonly id?: string; readonly fullName?: string };
  readonly pickupLocation?: { readonly id?: string; readonly name?: string };
  readonly dropOffLocation?: { readonly id?: string; readonly name?: string };
  readonly from?: string;
  readonly to?: string;
  readonly price?: number;
  readonly status?: string;
}

function getStatusColor(status?: string): "success" | "warning" | "error" | "default" {
  switch (status?.toLowerCase()) {
    case "paid":
    case "reserved":
      return "success";
    case "pending":
    case "deposit":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookingCard({ booking }: Readonly<{ booking: BookingItem }>) {
  const fromDate = formatDate(booking.from);
  const toDate = formatDate(booking.to);
  const imageUrl = toImageUrl(booking.car?.image) ?? "/placeholder-car.jpg";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, md: 0 },
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "border.main",
        bgcolor: "background.paper",
        boxShadow: "shadow.card",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "shadow.cardHover" },
      }}
    >
      {/* Mobile: Stacked layout */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {/* Header with car name and price */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              color="text.primary"
              sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
            >
              {booking.car?.name ?? "Unknown Car"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
              <BusinessIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {booking.supplier?.fullName ?? "Unknown Supplier"}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", ml: 2 }}>
            <Chip
              label={booking.status ?? "Unknown"}
              color={getStatusColor(booking.status)}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                mb: 1,
              }}
            />
            <Typography
              variant="h6"
              fontWeight={900}
              color="primary.main"
              sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
            >
              ${booking.price ?? 0}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: "0.65rem",
              }}
            >
              Total
            </Typography>
          </Box>
        </Box>

        {/* Car image */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 160, sm: 180 },
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "action.hover",
            mb: 2,
          }}
        >
          <Image
            src={imageUrl}
            alt={booking.car?.name ?? "Car image"}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </Box>

        {/* Locations & dates - Mobile stacked */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                mt: 0.25,
              }}
            >
              <LocationIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Pick-up
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {booking.pickupLocation?.name ?? "N/A"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                  {fromDate}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1.5,
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                display: "flex",
                mt: 0.25,
              }}
            >
              <LocationIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Drop-off
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {booking.dropOffLocation?.name ?? "N/A"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                  {toDate}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Action button - Mobile */}
        <Button
          component={Link}
          href={`/booking/${booking.id ?? ""}`}
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          fullWidth
          sx={{
            py: 1.5,
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          View Details
        </Button>
      </Box>

      {/* Desktop: Horizontal layout */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* Car image */}
        <Box
          sx={{
            position: "relative",
            width: 220,
            height: 140,
            flexShrink: 0,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "action.hover",
          }}
        >
          <Image
            src={imageUrl}
            alt={booking.car?.name ?? "Car image"}
            fill
            sizes="220px"
            style={{ objectFit: "cover" }}
          />
          <Box sx={{ position: "absolute", top: 10, left: 10 }}>
            <Chip
              label={booking.status ?? "Unknown"}
              color={getStatusColor(booking.status)}
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase" }}
            />
          </Box>
        </Box>

        {/* Details */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {booking.car?.name ?? "Unknown Car"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  {booking.supplier?.fullName ?? "Unknown Supplier"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                ${booking.price ?? 0}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ textTransform: "uppercase", letterSpacing: 1 }}
              >
                Total Price
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Locations & dates */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  display: "flex",
                  mt: 0.25,
                }}
              >
                <LocationIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  Pick-up
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {booking.pickupLocation?.name ?? "N/A"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled">
                    {fromDate}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  display: "flex",
                  mt: 0.25,
                }}
              >
                <LocationIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  Drop-off
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {booking.dropOffLocation?.name ?? "N/A"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled">
                    {toDate}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Action */}
        <Box sx={{ flexShrink: 0 }}>
          <Button
            component={Link}
            href={`/booking/${booking.id ?? ""}`}
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            Details
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
