"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PaymentIcon from "@mui/icons-material/Payment";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useSession } from "next-auth/react";
import { apiFetchJson, ApiError } from "@/utils/api-client";
import { logger } from "@/utils/logger";

// ── Shape from GET /api/dashboard/recent-summary ──────────────────────────────
interface RecentActivityItem {
  type: "booking" | "payment" | "user" | "vehicle";
  message: string;
  createdAt: string; // ISO-8601 UTC — always a real DB timestamp
  icon: string;
}

// ── Fallback: shapes from existing APIs ───────────────────────────────────────
interface RawBooking {
  id?: string | number;
  // BookingListDto fields (after rebuild includes these)
  bookingNumber?: string;
  status?: string;
  car?: { name?: string };
  createdAt?: string; // real creation timestamp (after rebuild)
  updatedAt?: string; // last status-change timestamp (after rebuild)
  // pre-rebuild only fields still available:
  from?: string; // pickup date (used as last-resort fallback only)
}

interface RawUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string; // always present — UserManagementDto always had this
}

interface RawVehicle {
  vehicleId?: string;
  id?: string | number;
  make?: string;
  model?: string;
  createdAt?: string; // present after VehicleListDto rebuild
}

// PagedResult<T> serializes as { data, page, pageSize, totalCount, totalPages }
// Some older admin endpoints wrap as { resultData, pageInfo }
interface AnyPagedResponse<T> {
  data?: T[];
  resultData?: T[];
  items?: T[];
}

// ── Icon / color map ─────────────────────────────────────────────────────────
const TYPE_META: Record<
  RecentActivityItem["type"],
  { color: "primary" | "success" | "warning" | "info"; icon: React.ReactNode }
> = {
  booking: { color: "primary", icon: <EventAvailableIcon fontSize="small" /> },
  payment: { color: "success", icon: <PaymentIcon fontSize="small" /> },
  user: { color: "info", icon: <PersonAddIcon fontSize="small" /> },
  vehicle: { color: "warning", icon: <DirectionsCarIcon fontSize="small" /> },
};

// ── Timestamp display ─────────────────────────────────────────────────────────
// Today   → relative  ("2 min ago", "1 hr ago", "just now")
// Older   → short date ("Apr 29", "May 1")
// Missing → "–"
function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "–";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "–";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "just now"; // clock-skew guard

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

  if (isToday) {
    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes.toString()} min ago`;
    return `${hours.toString()} hr ago`;
  }

  // Older than today → "Apr 29" or "Apr 29, 2025" for a different year
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

// ── Fallback helpers ──────────────────────────────────────────────────────────
const extractRows = <T,>(res: AnyPagedResponse<T> | null): T[] => res?.data ?? res?.resultData ?? [];

// Best available timestamp for a booking record
const bestBookingTs = (b: RawBooking): string | undefined => b.createdAt ?? (b.from ? b.from : undefined);

// Best available timestamp for a payment event (status changed to Confirmed/Completed)
const bestPaymentTs = (b: RawBooking): string | undefined =>
  b.updatedAt ?? b.createdAt ?? (b.from ? b.from : undefined);

// ── Fallback: build 4-item list from existing working APIs ────────────────────
async function fetchViaFallbackApis(
  accessToken: string,
  isSupplier: boolean,
  userId: string
): Promise<RecentActivityItem[]> {
  const [bookingsRes, usersRes, vehiclesRes] = await Promise.all([
    // POST /api/admin/bookings/search/1/10  → PagedResult<BookingListDto> → { data: [...] }
    apiFetchJson<AnyPagedResponse<RawBooking>>("api/admin/bookings/search/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        userId: null,
        suppliers: isSupplier ? [userId] : null,
        statuses: null,
        carId: null,
        filter: { from: null, to: null, keyword: null, pickupLocation: null, dropOffLocation: null },
        page: 1,
        size: 10,
        language: "en",
      }),
    }).catch((e: unknown) => {
      logger.error("RecentActivity fallback: bookings", e);
      return null;
    }),

    // POST /api/admin/users/1/10  → PagedResult<UserManagementDto> → { data: [...] }
    apiFetchJson<AnyPagedResponse<RawUser>>("api/admin/users/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ keyword: null, types: ["user"] }),
    }).catch((e: unknown) => {
      logger.error("RecentActivity fallback: users", e);
      return null;
    }),

    // POST /api/vehicles/search/1/10  → PagedResult<VehicleListDto> → { data: [...] }
    apiFetchJson<AnyPagedResponse<RawVehicle>>("api/vehicles/search/1/10", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ suppliers: null, keyword: null }),
    }).catch((e: unknown) => {
      logger.error("RecentActivity fallback: vehicles", e);
      return null;
    }),
  ]);

  // One slot per type — keep the most recently created
  const latestByType = new Map<RecentActivityItem["type"], RecentActivityItem>();

  const keepLatest = (item: RecentActivityItem) => {
    const prev = latestByType.get(item.type);
    if (!prev || new Date(item.createdAt) > new Date(prev.createdAt)) {
      latestByType.set(item.type, item);
    }
  };

  // ── Bookings + Payment ────────────────────────────────────────────────────
  const bookings = extractRows(bookingsRes);
  for (const b of bookings) {
    const rawId = String(b.id ?? "");
    const shortId = (b.bookingNumber ?? rawId.substring(0, 6)).toUpperCase() || "–";
    const carName = b.car?.name ?? "";

    const bTs = bestBookingTs(b);
    // Always add booking — if no real timestamp, show "–" rather than skip
    keepLatest({
      type: "booking",
      message: carName ? `Booking for ${carName} created` : `Booking #${shortId} created`,
      createdAt: bTs ?? "",
      icon: "booking",
    });

    // Payment: only when booking is paid (Confirmed or Completed)
    const isPaid = b.status === "Completed" || b.status === "Confirmed";
    if (isPaid) {
      const pTs = bestPaymentTs(b);
      keepLatest({
        type: "payment",
        message: carName ? `Payment completed for ${carName}` : `Payment completed for Booking #${shortId}`,
        createdAt: pTs ?? "",
        icon: "payment",
      });
    }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const users = extractRows(usersRes);
  for (const u of users) {
    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "New user";
    keepLatest({
      type: "user",
      message: `New user registered: ${fullName}`,
      createdAt: u.createdAt ?? "",
      icon: "user",
    });
    break; // UserManagementDto is sorted newest-first by the service; first is latest
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const vehicles = extractRows(vehiclesRes);
  for (const v of vehicles) {
    const label = [v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
    keepLatest({
      type: "vehicle",
      message: `Vehicle ${label} added`,
      // createdAt present after rebuild; show "–" (via formatTimestamp) if not yet
      createdAt: v.createdAt ?? "",
      icon: "vehicle",
    });
    break; // service orders newest-first; first entry is the latest
  }

  return [...latestByType.values()]
    .sort(
      (a, b) =>
        // Items without timestamps go to bottom
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )
    .slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RecentActivity() {
  const theme = useTheme();
  const { data: session } = useSession();

  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(false);

    try {
      const data = await apiFetchJson<RecentActivityItem[]>("api/dashboard/recent-summary", {
        accessToken: session.accessToken,
      });
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
      return;
    } catch (err: unknown) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status !== 404) {
        logger.error("RecentActivity: primary endpoint failed", err);
        setError(true);
        setLoading(false);
        return;
      }
      logger.warn("RecentActivity: /recent-summary not yet available, using fallback");
    }

    try {
      const isSupplier = session.user.roles.includes("Supplier");
      const userId = session.user.id;
      setItems(await fetchViaFallbackApis(session.accessToken, isSupplier, userId));
    } catch (err: unknown) {
      logger.error("RecentActivity: fallback failed", err);
      setItems([]);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  // ── Render ────────────────────────────────────────────────────────────────

  const renderBody = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
          <CircularProgress size={26} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 180,
            gap: 1,
          }}
        >
          <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
            Failed to load recent activity.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => {
              void fetchActivity();
            }}
          >
            Try again
          </Typography>
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
          <Typography color="text.secondary" variant="body2">
            No recent activity available.
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={0.5}>
        {items.map((item, idx) => {
          const meta = TYPE_META[item.type];
          const colorMain = theme.palette[meta.color].main;

          return (
            <Box
              key={`${item.type}-${idx.toString()}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                px: 1,
                borderRadius: 2,
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha(colorMain, 0.1),
                  color: colorMain,
                  flexShrink: 0,
                }}
              >
                {meta.icon}
              </Avatar>

              <Box
                sx={{
                  minWidth: 0,
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.84rem",
                    color: "text.primary",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.message}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  {formatTimestamp(item.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    );
  };

  return (
    <Card
      elevation={0}
      sx={t => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: t.palette.border.main,
        height: "100%",
        boxShadow: t.palette.shadow.card,
        overflow: "hidden",
      })}
    >
      <CardContent sx={{ p: 2.5, height: "100%", "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1rem" }}>
            Recent Activity
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              void fetchActivity();
            }}
            disabled={loading}
            aria-label="Refresh recent activity"
            sx={{ transition: "transform 0.25s ease", "&:hover": { transform: "rotate(90deg)" } }}
          >
            <RefreshIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Box>

        {renderBody()}
      </CardContent>
    </Card>
  );
}
