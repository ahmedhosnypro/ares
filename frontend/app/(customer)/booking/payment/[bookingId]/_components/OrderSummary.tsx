"use client";

import { Box, Paper, Stack, Typography, Divider } from "@mui/material";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import StarIcon from "@mui/icons-material/Star";
import { formatCurrency } from "@/utils/currency-helpers";
import { toImageUrl } from "@/utils/image-url";

interface OrderSummaryProps {
  readonly booking: {
    readonly car: {
      readonly make: string;
      readonly model: string;
      readonly image: string;
      readonly supplier: {
        readonly name: string;
      };
    };
    readonly pickupLocation: { readonly name: string };
    readonly dropOffLocation: { readonly name: string };
    readonly from: string;
    readonly to: string;
    readonly price: number;
    readonly originalPrice?: number;
    readonly discountAmount?: number;
  };
}

export default function OrderSummary({ booking }: OrderSummaryProps) {
  const pickupDate = new Date(booking.from);
  const returnDate = new Date(booking.to);
  const days = Math.max(1, Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        position: "sticky",
        top: 100,
        overflow: "hidden",
        boxShadow: t => t.palette.shadow.card,
      }}
    >
      {/* Vehicle Image Overlay */}
      <Box sx={{ height: 192, width: "100%", bgcolor: "background.default", position: "relative" }}>
        <Box
          component="img"
          src={toImageUrl(booking.car.image) || "https://placehold.co/600x400?text=Vehicle"}
          alt={`${booking.car.make} ${booking.car.model}`}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            bgcolor: "overlay.blur",
            backdropFilter: "blur(12px)",
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            boxShadow: 1,
          }}
        >
          <StarIcon sx={{ fontSize: 16, color: "primary.main", mr: 0.5 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
            Premium Class
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", mb: 0.5 }}>
          {booking.car.make} {booking.car.model}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Supplied by {booking.car.supplier.name}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Timeline Details */}
        <Stack spacing={3} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <FlightLandIcon color="primary" sx={{ mr: 2, mt: 0.5 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
              >
                Pickup
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                {booking.pickupLocation.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pickupDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <FlightTakeoffIcon color="action" sx={{ mr: 2, mt: 0.5 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
              >
                Return
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                {booking.dropOffLocation.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {returnDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Price Breakdown */}
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Rental ({days} {days === 1 ? "Day" : "Days"})
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 500 }}>
              {booking.originalPrice 
                ? formatCurrency(booking.originalPrice)
                : formatCurrency(booking.price)}
            </Typography>
          </Box>
          {booking.discountAmount ? (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="error.main">
                Discount
              </Typography>
              <Typography variant="body2" color="error.main" sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                -{formatCurrency(booking.discountAmount)}
              </Typography>
            </Box>
          ) : null}
          {/* Note: Mocking taxes/fees display as requested by the mockup, but keeping total correct based on booking.price */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
              Total Amount
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main", fontFamily: "monospace" }}>
              {formatCurrency(booking.price)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
