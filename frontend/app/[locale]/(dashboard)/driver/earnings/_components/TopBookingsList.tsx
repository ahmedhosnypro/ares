"use client";

import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import type { DriverTopBooking } from "@/api-clients/driver-earnings/driver-earnings";

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

interface TopBookingsListProps {
  bookings: DriverTopBooking[] | null;
  loading: boolean;
  error: string | null;
  labels: {
    topBookings: string;
    noTopBookings: string;
    topBookingsWillAppear: string;
  };
}

function BookingRow({ booking, rank }: { readonly booking: DriverTopBooking; readonly rank: number }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 1.5,
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: alpha(theme.palette.warning.main, 0.12),
          color: "warning.main",
          fontWeight: 800,
          fontSize: "0.85rem",
        }}
      >
        {rank}
      </Avatar>

      <Avatar
        variant="rounded"
        sx={{
          width: 48,
          height: 48,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
          borderRadius: 2,
        }}
      >
        <ReceiptLongOutlinedIcon />
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {booking.bookingNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {booking.vehicleName} &middot; {booking.customerName}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {formatCurrency(booking.netEarning)}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
          net earning
        </Typography>
      </Box>
    </Box>
  );
}

function TopBookingsSkeleton() {
  const theme = useTheme();
  const slots = [0, 1, 2, 3, 4];
  return (
    <Stack divider={<Divider flexItem />} spacing={0}>
      {slots.map(idx => (
        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
              fontWeight: 800,
              fontSize: "0.85rem",
            }}
          >
            {idx + 1}
          </Avatar>
          <Skeleton variant="rounded" width={48} height={48} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="70%" sx={{ fontSize: "0.95rem", lineHeight: 1.2 }} />
            <Skeleton variant="text" width="40%" sx={{ fontSize: "0.75rem", lineHeight: 1.2, mt: 0.25 }} />
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Skeleton variant="text" width={72} sx={{ fontSize: "0.95rem", lineHeight: 1.2 }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
              net earning
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export default function TopBookingsList({ bookings, loading, error, labels }: TopBookingsListProps) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <EmojiEventsIcon sx={{ color: "warning.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {labels.topBookings}
            </Typography>
          </Box>
          <Chip
            label="Top 5"
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              color: "warning.main",
            }}
          />
        </Box>

        {error ? (
          <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>
            {error}
          </Alert>
        ) : loading ? (
          <TopBookingsSkeleton />
        ) : bookings && bookings.length > 0 ? (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {bookings.map((b, idx) => (
              <BookingRow key={b.bookingId} booking={b} rank={idx + 1} />
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              py: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              textAlign: "center",
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {labels.noTopBookings}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 280 }}>
              {labels.topBookingsWillAppear}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
